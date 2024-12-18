import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Friendship } from './entities/friendship.entity';
import { GroupMember } from '../groups/entities/group-member.entity';

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  DO_NOT_DISTURB = 'do_not_disturb',
  INVISIBLE = 'invisible'
}

export enum UserActivity {
  NONE = 'none',
  GAMING = 'gaming',
  STREAMING = 'streaming',
  LISTENING = 'listening',
  WATCHING = 'watching'
}

@Entity()
export class User {
  @ApiProperty({ example: 1, description: 'The unique identifier of the user' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'john_doe', description: 'The username of the user' })
  @Column({ unique: true })
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'The email address of the user' })
  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'The display name of the user' })
  @Column({ nullable: true })
  displayName: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', description: 'The avatar URL of the user' })
  @Column({ nullable: true })
  avatarUrl: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ONLINE, description: 'The current status of the user' })
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.OFFLINE })
  status: UserStatus;

  @ApiProperty({ enum: UserActivity, example: UserActivity.GAMING, description: 'The current activity of the user' })
  @Column({ type: 'enum', enum: UserActivity, default: UserActivity.NONE })
  activity: UserActivity;

  @ApiProperty({ example: 'Playing Minecraft', description: 'Custom status message' })
  @Column({ nullable: true })
  statusMessage: string;

  @ApiProperty({ example: 'UTC+8', description: 'The timezone of the user' })
  @Column({ nullable: true })
  timezone: string;

  @ApiProperty({ example: 'en', description: 'The preferred language of the user' })
  @Column({ default: 'en' })
  language: string;

  @ApiProperty({ example: false, description: 'Whether the user has enabled two-factor authentication' })
  @Column({ default: false })
  twoFactorEnabled: boolean;

  @ApiProperty({ example: 'channel-1', description: 'The ID of the current voice channel' })
  @Column({ nullable: true })
  currentVoiceChannelId: string;

  @ApiProperty({ example: false, description: 'Whether the user is muted' })
  @Column({ default: false })
  isMuted: boolean;

  @ApiProperty({ example: false, description: 'Whether the user is deafened' })
  @Column({ default: false })
  isDeafened: boolean;

  @ApiProperty({ example: 1.0, description: 'The user\'s input volume multiplier' })
  @Column({ type: 'float', default: 1.0 })
  inputVolume: number;

  @ApiProperty({ example: 1.0, description: 'The user\'s output volume multiplier' })
  @Column({ type: 'float', default: 1.0 })
  outputVolume: number;

  @OneToMany(() => Friendship, friendship => friendship.sender)
  sentFriendships: Friendship[];

  @OneToMany(() => Friendship, friendship => friendship.receiver)
  receivedFriendships: Friendship[];

  @OneToMany(() => GroupMember, member => member.user)
  groupMemberships: GroupMember[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'The date when the user was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'The date when the user was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ example: false, description: 'Whether the user is currently online' })
  @Column({ default: false })
  isOnline: boolean;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
