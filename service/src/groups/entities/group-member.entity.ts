import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/user.entity';
import { Group } from './group.entity';

export enum GroupRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member'
}

export enum GroupPermission {
  MANAGE_GROUP = 'manage_group',
  MANAGE_MEMBERS = 'manage_members',
  MANAGE_CHANNELS = 'manage_channels',
  KICK_MEMBERS = 'kick_members',
  BAN_MEMBERS = 'ban_members',
  INVITE_MEMBERS = 'invite_members',
  SPEAK = 'speak',
  STREAM = 'stream',
  SHARE_SCREEN = 'share_screen'
}

@Entity()
export class GroupMember {
  @ApiProperty({ example: 1, description: 'The unique identifier of the group member' })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Group, group => group.members, { onDelete: 'CASCADE' })
  @JoinColumn()
  group: Group;

  @ApiProperty({ enum: GroupRole, example: GroupRole.MEMBER, description: 'The role of the member in the group' })
  @Column({ type: 'enum', enum: GroupRole, default: GroupRole.MEMBER })
  role: GroupRole;

  @ApiProperty({ type: [String], example: [GroupPermission.SPEAK], description: 'The permissions of the member' })
  @Column('simple-array')
  permissions: GroupPermission[];

  @ApiProperty({ example: 'Cool Guy', description: 'The nickname of the member in this group' })
  @Column({ nullable: true })
  nickname: string;

  @ApiProperty({ example: false, description: 'Whether the member is muted in this group' })
  @Column({ default: false })
  isMuted: boolean;

  @ApiProperty({ example: false, description: 'Whether the member is deafened in this group' })
  @Column({ default: false })
  isDeafened: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'The date when the member joined' })
  @CreateDateColumn()
  joinedAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'The date when the member was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
