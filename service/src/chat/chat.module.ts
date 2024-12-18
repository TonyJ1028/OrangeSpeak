import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from '../users/users.module';
import { GroupsModule } from '../groups/groups.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, GroupsModule, AuthModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
