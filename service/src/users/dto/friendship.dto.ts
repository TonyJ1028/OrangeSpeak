import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { FriendshipStatus } from '../entities/friendship.entity';

export class CreateFriendRequestDto {
  @ApiProperty({ example: 1, description: 'The ID of the user to send friend request to' })
  receiverId: number;

  @ApiProperty({ example: 'Gaming Buddy', description: 'Custom nickname for the friend', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nickname?: string;

  @ApiProperty({ example: 'Met in Minecraft', description: 'Notes about the friendship', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  notes?: string;
}

export class UpdateFriendshipDto {
  @ApiProperty({ enum: FriendshipStatus, example: FriendshipStatus.ACCEPTED, description: 'The status of the friendship' })
  @IsEnum(FriendshipStatus)
  @IsOptional()
  status?: FriendshipStatus;

  @ApiProperty({ example: 'Gaming Buddy', description: 'Custom nickname for the friend' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nickname?: string;

  @ApiProperty({ example: 'Met in Minecraft', description: 'Notes about the friendship' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  notes?: string;
}

export class FriendshipResponseDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the friendship' })
  id: number;

  @ApiProperty({ example: { id: 1, username: 'john_doe' }, description: 'The user who sent the friend request' })
  sender: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };

  @ApiProperty({ example: { id: 2, username: 'jane_doe' }, description: 'The user who received the friend request' })
  receiver: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };

  @ApiProperty({ enum: FriendshipStatus, example: FriendshipStatus.PENDING, description: 'The status of the friendship' })
  status: FriendshipStatus;

  @ApiProperty({ example: 'Gaming Buddy', description: 'Custom nickname for the friend' })
  nickname?: string;

  @ApiProperty({ example: 'Met in Minecraft', description: 'Notes about the friendship' })
  notes?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'The date when the friendship was created' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'The date when the friendship was last updated' })
  updatedAt: Date;
}
