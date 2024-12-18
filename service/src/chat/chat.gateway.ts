import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { BaseGateway } from '../common/gateways/base.gateway';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { VoiceService } from '../voice/voice.service';
import { SendMessageDto, MessageDto, ReadReceiptDto } from './dto/message.dto';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*', // Configure appropriately in production
  },
})
@UseGuards(WsJwtAuthGuard)
export class ChatGateway extends BaseGateway implements OnGatewayInit {
  // Store unread messages temporarily (not persistent)
  private unreadMessages: Map<string, MessageDto> = new Map();
  // Store read receipts temporarily (not persistent)
  private messageReadReceipts: Map<string, Set<number>> = new Map();
  // Store active rooms for users
  private userRooms: Map<number, Set<string>> = new Map();

  constructor(
    protected readonly jwtService: JwtService,
    protected readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly voiceService: VoiceService,
  ) {
    super(jwtService, usersService);
  }

  afterInit() {
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupOldMessages();
    }, 3600000); // Clean up every hour
  }

  async handleConnection(client: Socket) {
    await super.handleConnection(client);
    const user = client.data.user;
    if (user) {
      // Join all user's group rooms
      const groups = await this.groupsService.findUserGroups(user.id);
      for (const group of groups) {
        await this.joinGroupRooms(client, group.id);
      }
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      // Leave all rooms
      const rooms = this.userRooms.get(user.id) || new Set();
      for (const room of rooms) {
        await client.leave(room);
      }
      this.userRooms.delete(user.id);
    }
    await super.handleDisconnect(client);
  }

  private async joinGroupRooms(client: Socket, groupId: number) {
    const user = client.data.user;
    const rooms = [`group:${groupId}`, `group:${groupId}:chat`, `group:${groupId}:voice`];
    
    // Add rooms to user's room set
    if (!this.userRooms.has(user.id)) {
      this.userRooms.set(user.id, new Set());
    }
    const userRooms = this.userRooms.get(user.id);
    
    // Join each room
    for (const room of rooms) {
      await client.join(room);
      userRooms.add(room);
    }
  }

  private async leaveGroupRooms(client: Socket, groupId: number) {
    const user = client.data.user;
    const rooms = [`group:${groupId}`, `group:${groupId}:chat`, `group:${groupId}:voice`];
    
    // Leave each room
    for (const room of rooms) {
      await client.leave(room);
      this.userRooms.get(user.id)?.delete(room);
    }
  }

  @SubscribeMessage('joinGroupChat')
  async handleJoinGroupChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: number },
  ) {
    const user = client.data.user;
    const member = await this.groupsService.findMember(data.groupId, user.id);
    
    if (!member) {
      return { error: 'Not a member of this group' };
    }

    await this.joinGroupRooms(client, data.groupId);
    return { success: true };
  }

  @SubscribeMessage('leaveGroupChat')
  async handleLeaveGroupChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: number },
  ) {
    await this.leaveGroupRooms(client, data.groupId);
    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: SendMessageDto,
  ) {
    const user = client.data.user;

    const messageDto: MessageDto = {
      id: uuidv4(),
      content: message.content,
      sender: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      timestamp: Date.now(),
      attachments: message.attachments,
      readBy: [{
        userId: user.id,
        timestamp: Date.now(),
      }],
    };

    this.unreadMessages.set(messageDto.id, messageDto);
    this.messageReadReceipts.set(messageDto.id, new Set([user.id]));

    if (message.groupId) {
      const member = await this.groupsService.findMember(message.groupId, user.id);
      if (!member) {
        return { error: 'Not a member of this group' };
      }

      this.server.to(`group:${message.groupId}:chat`).emit('groupMessage', {
        groupId: message.groupId,
        message: messageDto,
      });
    } else if (message.recipientId) {
      await this.emitToUser(message.recipientId, 'directMessage', {
        message: messageDto,
      });
    }

    return { success: true, messageId: messageDto.id };
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ReadReceiptDto,
  ) {
    const user = client.data.user;
    const message = this.unreadMessages.get(data.messageId);
    
    if (!message) {
      return { error: 'Message not found' };
    }

    // Add read receipt
    const readReceipts = this.messageReadReceipts.get(data.messageId);
    if (readReceipts && !readReceipts.has(user.id)) {
      readReceipts.add(user.id);
      
      const readReceiptData = {
        messageId: data.messageId,
        userId: user.id,
        timestamp: Date.now(),
      };

      // Update message read status
      if (!message.readBy) {
        message.readBy = [];
      }
      message.readBy.push({
        userId: user.id,
        timestamp: Date.now(),
      });

      // Notify the sender
      if (data.groupId) {
        this.server.to(`group:${data.groupId}`).emit('messageRead', readReceiptData);
      } else if (data.senderId) {
        await this.emitToUser(data.senderId, 'messageRead', readReceiptData);
      }
    }

    return { success: true };
  }

  @SubscribeMessage('getReadReceipts')
  async handleGetReadReceipts(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const message = this.unreadMessages.get(data.messageId);
    if (!message) {
      return { error: 'Message not found' };
    }

    return {
      success: true,
      messageId: data.messageId,
      readBy: message.readBy || [],
    };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId?: number; recipientId?: number },
  ) {
    const user = client.data.user;
    const typingData = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    };

    if (data.groupId) {
      this.server.to(`group:${data.groupId}`).emit('userTyping', {
        groupId: data.groupId,
        user: typingData,
      });
    } else if (data.recipientId) {
      await this.emitToUser(data.recipientId, 'userTypingDM', typingData);
    }

    return { success: true };
  }

  @SubscribeMessage('stopTyping')
  async handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId?: number; recipientId?: number },
  ) {
    const user = client.data.user;

    if (data.groupId) {
      this.server.to(`group:${data.groupId}`).emit('userStoppedTyping', {
        groupId: data.groupId,
        userId: user.id,
      });
    } else if (data.recipientId) {
      await this.emitToUser(data.recipientId, 'userStoppedTypingDM', {
        userId: user.id,
      });
    }

    return { success: true };
  }

  // Clean up old messages periodically (e.g., every hour)
  private cleanupOldMessages() {
    const oneHourAgo = Date.now() - 3600000;
    for (const [messageId, message] of this.unreadMessages.entries()) {
      if (message.timestamp < oneHourAgo) {
        this.unreadMessages.delete(messageId);
        this.messageReadReceipts.delete(messageId);
      }
    }
  }
}
