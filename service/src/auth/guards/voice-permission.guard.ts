import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { VoiceService } from '../../voice/voice.service';
import { GroupsService } from '../../groups/groups.service';

@Injectable()
export class VoicePermissionGuard implements CanActivate {
  constructor(
    private voiceService: VoiceService,
    private groupsService: GroupsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const channelId = request.params.channelId || request.body.channelId;

    if (!channelId) {
      return true;
    }

    // Get channel and associated group
    const channel = await this.voiceService.findOne(channelId);
    if (!channel) {
      throw new ForbiddenException('Voice channel not found');
    }

    // Check if user is member of the group
    const member = await this.groupsService.findMember(channel.groupId, user.id);
    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Check permissions based on operation
    const method = request.method;
    switch (method) {
      case 'DELETE':
        return ['owner', 'admin'].includes(member.role);
      case 'PUT':
      case 'PATCH':
        return ['owner', 'admin', 'moderator'].includes(member.role);
      case 'POST':
        if (request.path.includes('/join')) {
          // Additional checks for joining (e.g., channel capacity)
          const currentUsers = await this.voiceService.getCurrentUsers(channelId);
          return currentUsers.length < channel.maxUsers;
        }
        return ['owner', 'admin', 'moderator'].includes(member.role);
      default:
        return true;
    }
  }
}
