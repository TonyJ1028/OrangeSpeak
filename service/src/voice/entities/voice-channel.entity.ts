import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/user.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity()
export class VoiceChannel {
  @ApiProperty({ example: 1, description: 'The unique identifier of the voice channel' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'General Voice', description: 'The name of the voice channel' })
  @Column()
  name: string;

  @ApiProperty({ example: 10, description: 'Maximum number of users allowed in the channel' })
  @Column({ default: 10 })
  maxUsers: number;

  @ApiProperty({ example: true, description: 'Whether the channel is currently active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ example: 'gaming', description: 'The type of the channel' })
  @Column({ nullable: true })
  type: string;

  @ApiProperty({ example: 1, description: 'The position of the channel in the list' })
  @Column({ default: 0 })
  position: number;

  @ApiProperty({ example: 1, description: 'The ID of the group this channel belongs to' })
  @Column()
  groupId: number;

  @ManyToOne(() => Group, group => group.voiceChannels, { onDelete: 'CASCADE' })
  group: Group;

  @ApiProperty({ type: () => [User], description: 'Users currently in the channel' })
  @OneToMany(() => User, user => user.currentVoiceChannelId)
  activeUsers: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
