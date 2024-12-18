import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';

export class BaseGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    protected readonly jwtService: JwtService,
    protected readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;
      await this.usersService.updateStatus(user.id, 'online');
    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data.user) {
      await this.usersService.updateStatus(client.data.user.id, 'offline');
    }
  }

  async emitToUser(userId: number, event: string, data: any) {
    const connections = await this.server.fetchSockets();
    connections
      .filter((socket) => socket.data.user?.id === userId)
      .forEach((socket) => socket.emit(event, data));
  }

  async emitToGroup(groupId: number, event: string, data: any, exceptUserId?: number) {
    const connections = await this.server.fetchSockets();
    connections
      .filter((socket) => 
        socket.data.user?.groups?.some((g) => g.id === groupId) &&
        socket.data.user?.id !== exceptUserId
      )
      .forEach((socket) => socket.emit(event, data));
  }
}
