import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsOptional } from 'class-validator';

export class ReadReceiptDto {
  @ApiProperty({
    example: '2024-12-18T07:17:48.000Z',
    description: 'Timestamp when the message was read',
    required: false
  })
  @IsDate()
  @IsOptional()
  readAt?: Date;
}
