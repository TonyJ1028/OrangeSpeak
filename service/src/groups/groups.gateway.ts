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
import { GroupsService } from './groups.service';

@WebSocketGateway({
  namespace: 'groups',
  cors: {
    origin: '*', // Configure appropriately in production
  },
})
@UseGuards(WsJwtAuthGuard)
export class GroupsGateway extends BaseGateway {
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {
    super(jwtService, usersService);
  }

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: number },
  ) {
    const group = await this.groupsService.findOne(data.groupId);
    if (!group) {
      return { error: 'Group not found' };
    }

    await client.join(`group:${data.groupId}`);
    return { success: true };
  }

  @SubscribeMessage('leaveGroup')
  async handleLeaveGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: number },
  ) {
    await client.leave(`group:${data.groupId}`);
    return { success: true };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: number; channelId: number },
  ) {
    const user = client.data.user;
    this.server.to(`group:${data.groupId}`).emit('userTyping', {
      groupId: data.groupId,
      channelId: data.channelId,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  }

  @SubscribeMessage('stopTyping')
  async handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: number; channelId: number },
  ) {
    const user = client.data.user;
    this.server.to(`group:${data.groupId}`).emit('userStoppedTyping', {
      groupId: data.groupId,
      channelId: data.channelId,
      userId: user.id,
    });
  }

  // Emit events to group members
  async notifyGroupUpdate(groupId: number, data: any) {
    this.server.to(`group:${groupId}`).emit('groupUpdate', data);
  }

  async notifyMemberJoined(groupId: number, member: any) {
    this.server.to(`group:${groupId}`).emit('memberJoined', member);
  }

  async notifyMemberLeft(groupId: number, memberId: number) {
    this.server.to(`group:${groupId}`).emit('memberLeft', { groupId, memberId });
  }

  async notifyRoleUpdate(groupId: number, memberId: number, role: string) {
    this.server.to(`group:${groupId}`).emit('memberRoleUpdate', {
      groupId,
      memberId,
      role,
    });
  }
}
