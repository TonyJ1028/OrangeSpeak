import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, MinLength, MaxLength, Min, Max } from 'class-validator';

export class CreateVoiceChannelDto {
  @ApiProperty({ example: 'General Voice', description: 'The name of the voice channel' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 10, description: 'Maximum number of users allowed in the channel' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(99)
  maxUsers?: number;

  @ApiProperty({ example: 'gaming', description: 'The type of the channel' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 1, description: 'The position of the channel in the list' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  position?: number;

  @ApiProperty({ example: 1, description: 'The ID of the group this channel belongs to' })
  @IsNumber()
  groupId: number;
}
