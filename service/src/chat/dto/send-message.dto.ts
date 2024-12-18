import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example: 'Hello everyone!',
    description: 'The content of the message'
  })
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiProperty({
    example: 1,
    description: 'ID of the group to send the message to (required for group messages)',
    required: false
  })
  @IsNumber()
  @IsOptional()
  groupId?: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the user to send the direct message to (required for direct messages)',
    required: false
  })
  @IsNumber()
  @IsOptional()
  recipientId?: number;
}
