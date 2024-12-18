import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNumber, IsUrl, MinLength, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Gaming Squad', description: 'The name of the group' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'A group for gamers', description: 'The description of the group' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'gaming-squad', description: 'Unique identifier for the group in URLs' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  slug: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', description: 'The avatar URL of the group' })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ example: true, description: 'Whether the group is public or private' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ example: 100, description: 'Maximum number of members allowed' })
  @IsNumber()
  @IsOptional()
  maxMembers?: number;
}
