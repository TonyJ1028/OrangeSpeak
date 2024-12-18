import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { UserStatus, UserActivity } from '../user.entity';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.ONLINE, description: 'The status of the user' })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({ enum: UserActivity, example: UserActivity.GAMING, description: 'The activity of the user' })
  @IsEnum(UserActivity)
  @IsOptional()
  activity?: UserActivity;

  @ApiProperty({ example: 'Playing Minecraft', description: 'Custom status message' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  statusMessage?: string;
}
