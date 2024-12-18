import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/user.entity';
import { VoiceChannel } from '../../voice/entities/voice-channel.entity';
import { GroupMember } from './group-member.entity';

@Entity()
export class Group {
  @ApiProperty({ example: 1, description: 'The unique identifier of the group' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Gaming Squad', description: 'The name of the group' })
  @Column()
  name: string;

  @ApiProperty({ example: 'A group for gamers', description: 'The description of the group' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ example: 'gaming-squad', description: 'Unique identifier for the group in URLs' })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', description: 'The avatar URL of the group' })
  @Column({ nullable: true })
  avatarUrl: string;

  @ApiProperty({ example: true, description: 'Whether the group is public or private' })
  @Column({ default: true })
  isPublic: boolean;

  @ApiProperty({ example: 100, description: 'Maximum number of members allowed' })
  @Column({ default: 100 })
  maxMembers: number;

  @OneToMany(() => GroupMember, member => member.group)
  members: GroupMember[];

  @OneToMany(() => VoiceChannel, channel => channel.group)
  voiceChannels: VoiceChannel[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'The date when the group was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'The date when the group was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
