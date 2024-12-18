import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { BaseGateway } from '../common/gateways/base.gateway';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { VoiceService } from './voice.service';
import { UpdateVoiceControlDto } from './dto/voice-control.dto';
import { AudioSettingsDto } from './dto/audio-settings.dto';

@WebSocketGateway({
  namespace: 'voice',
  cors: {
    origin: '*', // Configure appropriately in production
  },
})
@UseGuards(WsJwtAuthGuard)
export class VoiceGateway extends BaseGateway {
  private channelUsers: Map<number, Set<number>> = new Map();

  constructor(
    protected readonly jwtService: JwtService,
    protected readonly usersService: UsersService,
    private readonly voiceService: VoiceService,
  ) {
    super(jwtService, usersService);
  }

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: number },
  ) {
    const user = client.data.user;
    const channel = await this.voiceService.findOne(data.channelId);
    
    if (!channel) {
      return { error: 'Channel not found' };
    }

    // Check channel capacity
    const currentUsers = this.getChannelUsers(data.channelId);
    if (currentUsers.size >= channel.maxUsers) {
      return { error: 'Channel is full' };
    }

    // Join socket.io room
    await client.join(`voice:${data.channelId}`);
    
    // Add user to channel
    this.addUserToChannel(data.channelId, user.id);
    
    // Notify others
    this.server.to(`voice:${data.channelId}`).emit('userJoined', {
      channelId: data.channelId,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });

    // Return current users in channel
    return {
      success: true,
      users: Array.from(currentUsers).map(userId => ({
        id: userId,
        ...this.usersService.findOne(userId),
      })),
    };
  }

  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: number },
  ) {
    const user = client.data.user;
    
    await client.leave(`voice:${data.channelId}`);
    this.removeUserFromChannel(data.channelId, user.id);
    
    this.server.to(`voice:${data.channelId}`).emit('userLeft', {
      channelId: data.channelId,
      userId: user.id,
    });

    return { success: true };
  }

  @SubscribeMessage('updateVoiceControl')
  async handleVoiceControl(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UpdateVoiceControlDto,
  ) {
    const user = client.data.user;
    
    this.server.to(`voice:${data.channelId}`).emit('voiceControlUpdate', {
      channelId: data.channelId,
      userId: user.id,
      ...data,
    });

    return { success: true };
  }

  @SubscribeMessage('updateAudioSettings')
  async handleAudioSettings(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AudioSettingsDto,
  ) {
    const user = client.data.user;
    
    await this.voiceService.updateUserAudioSettings(user.id, data);
    
    return { success: true };
  }

  @SubscribeMessage('signal')
  async handleSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: number; signal: any },
  ) {
    const user = client.data.user;
    
    await this.emitToUser(data.targetUserId, 'signal', {
      fromUserId: user.id,
      signal: data.signal,
    });

    return { success: true };
  }

  private getChannelUsers(channelId: number): Set<number> {
    if (!this.channelUsers.has(channelId)) {
      this.channelUsers.set(channelId, new Set());
    }
    return this.channelUsers.get(channelId);
  }

  private addUserToChannel(channelId: number, userId: number) {
    const users = this.getChannelUsers(channelId);
    users.add(userId);
  }

  private removeUserFromChannel(channelId: number, userId: number) {
    const users = this.getChannelUsers(channelId);
    users.delete(userId);
    if (users.size === 0) {
      this.channelUsers.delete(channelId);
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      // Find and leave all channels
      for (const [channelId, users] of this.channelUsers.entries()) {
        if (users.has(user.id)) {
          this.removeUserFromChannel(channelId, user.id);
          this.server.to(`voice:${channelId}`).emit('userLeft', {
            channelId,
            userId: user.id,
          });
        }
      }
    }
    await super.handleDisconnect(client);
  }
}
