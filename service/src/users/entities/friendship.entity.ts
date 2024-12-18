import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user.entity';

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked'
}

@Entity()
export class Friendship {
  @ApiProperty({ example: 1, description: 'The unique identifier of the friendship' })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  sender: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  receiver: User;

  @ApiProperty({ enum: FriendshipStatus, example: FriendshipStatus.PENDING, description: 'The status of the friendship' })
  @Column({ type: 'enum', enum: FriendshipStatus, default: FriendshipStatus.PENDING })
  status: FriendshipStatus;

  @ApiProperty({ example: 'Gaming Buddy', description: 'Custom nickname for the friend' })
  @Column({ nullable: true })
  nickname: string;

  @ApiProperty({ example: 'Friends from gaming', description: 'Notes about the friendship' })
  @Column({ nullable: true })
  notes: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'The date when the friendship was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'The date when the friendship was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
