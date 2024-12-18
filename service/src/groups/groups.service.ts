import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupMember, GroupRole, GroupPermission } from './entities/group-member.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddGroupMemberDto, UpdateGroupMemberDto } from './dto/group-member.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,
    private usersService: UsersService,
  ) {}

  async create(createGroupDto: CreateGroupDto, userId: number) {
    // 检查 slug 是否已存在
    const existingGroup = await this.groupRepository.findOne({
      where: { slug: createGroupDto.slug },
    });
    if (existingGroup) {
      throw new BadRequestException('Group slug already exists');
    }

    // 创建群组
    const group = this.groupRepository.create(createGroupDto);
    await this.groupRepository.save(group);

    // 添加创建者作为群主
    const owner = await this.groupMemberRepository.create({
      user: { id: userId },
      group,
      role: GroupRole.OWNER,
      permissions: Object.values(GroupPermission),
    });
    await this.groupMemberRepository.save(owner);

    return group;
  }

  async findAll(userId: number) {
    // 获取用户加入的所有群组
    const members = await this.groupMemberRepository.find({
      where: { user: { id: userId } },
      relations: ['group'],
    });
    return members.map(member => member.group);
  }

  async findOne(id: number, userId: number) {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['members', 'members.user', 'voiceChannels'],
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // 检查用户是否有权限查看该群组
    if (!group.isPublic) {
      const isMember = await this.isMember(id, userId);
      if (!isMember) {
        throw new ForbiddenException('You do not have permission to view this group');
      }
    }

    return group;
  }

  async update(id: number, updateGroupDto: UpdateGroupDto, userId: number) {
    const group = await this.findOne(id, userId);
    
    // 检查用户是否有权限更新群组
    const member = await this.getMember(id, userId);
    if (!this.hasPermission(member, GroupPermission.MANAGE_GROUP)) {
      throw new ForbiddenException('You do not have permission to update this group');
    }

    // 如果更新 slug，检查是否已存在
    if (updateGroupDto.slug) {
      const existingGroup = await this.groupRepository.findOne({
        where: { slug: updateGroupDto.slug, id: Not(id) },
      });
      if (existingGroup) {
        throw new BadRequestException('Group slug already exists');
      }
    }

    Object.assign(group, updateGroupDto);
    return this.groupRepository.save(group);
  }

  async remove(id: number, userId: number) {
    const group = await this.findOne(id, userId);
    
    // 检查用户是否是群主
    const member = await this.getMember(id, userId);
    if (member.role !== GroupRole.OWNER) {
      throw new ForbiddenException('Only the group owner can delete the group');
    }

    await this.groupRepository.remove(group);
  }

  async addMember(groupId: number, addMemberDto: AddGroupMemberDto, addedByUserId: number) {
    const group = await this.findOne(groupId, addedByUserId);
    
    // 检查是否有权限添加成员
    const addedByMember = await this.getMember(groupId, addedByUserId);
    if (!this.hasPermission(addedByMember, GroupPermission.MANAGE_MEMBERS)) {
      throw new ForbiddenException('You do not have permission to add members');
    }

    // 检查用户是否存在
    const user = await this.usersService.findOne(addMemberDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 检查是否已经是成员
    const existingMember = await this.groupMemberRepository.findOne({
      where: { group: { id: groupId }, user: { id: addMemberDto.userId } },
    });
    if (existingMember) {
      throw new BadRequestException('User is already a member of this group');
    }

    // 检查成员数量限制
    const memberCount = await this.groupMemberRepository.count({
      where: { group: { id: groupId } },
    });
    if (memberCount >= group.maxMembers) {
      throw new BadRequestException('Group has reached maximum member limit');
    }

    // 创建新成员
    const member = this.groupMemberRepository.create({
      user: { id: addMemberDto.userId },
      group: { id: groupId },
      role: addMemberDto.role || GroupRole.MEMBER,
      nickname: addMemberDto.nickname,
      permissions: [GroupPermission.SPEAK, GroupPermission.STREAM],
    });

    return this.groupMemberRepository.save(member);
  }

  async updateMember(groupId: number, memberId: number, updateMemberDto: UpdateGroupMemberDto, updatedByUserId: number) {
    const member = await this.groupMemberRepository.findOne({
      where: { id: memberId, group: { id: groupId } },
      relations: ['user', 'group'],
    });
    if (!member) {
      throw new NotFoundException('Group member not found');
    }

    // 检查权限
    const updatedByMember = await this.getMember(groupId, updatedByUserId);
    if (!this.hasPermission(updatedByMember, GroupPermission.MANAGE_MEMBERS)) {
      throw new ForbiddenException('You do not have permission to update members');
    }

    // 不允许修改群主的角色
    if (member.role === GroupRole.OWNER && updateMemberDto.role) {
      throw new ForbiddenException('Cannot change the role of the group owner');
    }

    // 只有群主可以设置管理员
    if (updateMemberDto.role === GroupRole.ADMIN && updatedByMember.role !== GroupRole.OWNER) {
      throw new ForbiddenException('Only the group owner can set administrators');
    }

    Object.assign(member, updateMemberDto);
    return this.groupMemberRepository.save(member);
  }

  async removeMember(groupId: number, memberId: number, removedByUserId: number) {
    const member = await this.groupMemberRepository.findOne({
      where: { id: memberId, group: { id: groupId } },
      relations: ['user', 'group'],
    });
    if (!member) {
      throw new NotFoundException('Group member not found');
    }

    // 检查权限
    const removedByMember = await this.getMember(groupId, removedByUserId);
    if (!this.hasPermission(removedByMember, GroupPermission.MANAGE_MEMBERS)) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    // 不能移除群主
    if (member.role === GroupRole.OWNER) {
      throw new ForbiddenException('Cannot remove the group owner');
    }

    // 管理员不能互相移除
    if (member.role === GroupRole.ADMIN && removedByMember.role !== GroupRole.OWNER) {
      throw new ForbiddenException('Only the group owner can remove administrators');
    }

    await this.groupMemberRepository.remove(member);
  }

  private async getMember(groupId: number, userId: number): Promise<GroupMember> {
    const member = await this.groupMemberRepository.findOne({
      where: { group: { id: groupId }, user: { id: userId } },
    });
    if (!member) {
      throw new NotFoundException('You are not a member of this group');
    }
    return member;
  }

  private async isMember(groupId: number, userId: number): Promise<boolean> {
    const count = await this.groupMemberRepository.count({
      where: { group: { id: groupId }, user: { id: userId } },
    });
    return count > 0;
  }

  private hasPermission(member: GroupMember, permission: GroupPermission): boolean {
    if (member.role === GroupRole.OWNER) return true;
    return member.permissions.includes(permission);
  }
}
