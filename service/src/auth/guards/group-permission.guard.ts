import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GroupsService } from '../../groups/groups.service';

@Injectable()
export class GroupPermissionGuard implements CanActivate {
  constructor(private groupsService: GroupsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const groupId = request.params.groupId || request.body.groupId;

    if (!groupId) {
      return true;
    }

    const member = await this.groupsService.findMember(groupId, user.id);
    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Check if user has required role for the operation
    const method = request.method;
    switch (method) {
      case 'DELETE':
        return member.role === 'owner';
      case 'PUT':
      case 'PATCH':
        return ['owner', 'admin'].includes(member.role);
      default:
        return true;
    }
  }
}
