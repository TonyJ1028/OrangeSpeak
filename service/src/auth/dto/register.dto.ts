import { IsString, MinLength, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: '用户名',
    example: 'johndoe',
    minLength: 3
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: '电子邮箱',
    example: 'john@example.com',
    required: false
  })
  @IsOptional()
  @IsEmail()
  email?: string;
} 