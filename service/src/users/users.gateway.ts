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
import { UsersService } from './users.service';
import { FriendshipService } from './friendship.service';

@WebSocketGateway({
  namespace: 'users',
  cors: {
    origin: '*', // Configure appropriately in production
  },
})
@UseGuards(WsJwtAuthGuard)
export class UsersGateway extends BaseGateway {
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly usersService: UsersService,
    private readonly friendshipService: FriendshipService,
  ) {
    super(jwtService, usersService);
  }

  @SubscribeMessage('updateStatus')
  async handleStatusUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { status: string; activity?: string },
  ) {
    const user = client.data.user;
    await this.usersService.updateStatus(user.id, data.status, data.activity);

    // Notify friends about status update
    const friends = await this.friendshipService.getUserFriends(user.id);
    friends.forEach(friend => {
      this.emitToUser(friend.id, 'friendStatusUpdate', {
        userId: user.id,
        status: data.status,
        activity: data.activity,
      });
    });

    return { success: true };
  }

  @SubscribeMessage('startTypingDM')
  async handleStartTypingDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: number },
  ) {
    const user = client.data.user;
    await this.emitToUser(data.targetUserId, 'userTypingDM', {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    });

    return { success: true };
  }

  @SubscribeMessage('stopTypingDM')
  async handleStopTypingDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: number },
  ) {
    const user = client.data.user;
    await this.emitToUser(data.targetUserId, 'userStoppedTypingDM', {
      userId: user.id,
    });

    return { success: true };
  }

  // Methods to emit events
  async notifyFriendRequest(targetUserId: number, request: any) {
    await this.emitToUser(targetUserId, 'friendRequest', request);
  }

  async notifyFriendRequestAccepted(targetUserId: number, friend: any) {
    await this.emitToUser(targetUserId, 'friendRequestAccepted', friend);
  }

  async notifyFriendRequestRejected(targetUserId: number, requestId: number) {
    await this.emitToUser(targetUserId, 'friendRequestRejected', { requestId });
  }

  async notifyFriendRemoved(targetUserId: number, removedFriendId: number) {
    await this.emitToUser(targetUserId, 'friendRemoved', { friendId: removedFriendId });
  }

  async notifyUserBlocked(targetUserId: number, blockedUserId: number) {
    await this.emitToUser(targetUserId, 'userBlocked', { userId: blockedUserId });
  }

  async notifyUserUnblocked(targetUserId: number, unblockedUserId: number) {
    await this.emitToUser(targetUserId, 'userUnblocked', { userId: unblockedUserId });
  }
}
