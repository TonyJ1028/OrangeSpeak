import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, MaxLength, IsUrl } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'The username of the user',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email address of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password for the account',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The display name of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  displayName?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    description: 'The avatar URL of the user',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    example: 'UTC+8',
    description: 'The timezone of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({
    example: 'en',
    description: 'The preferred language of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(5)
  language?: string;
}
