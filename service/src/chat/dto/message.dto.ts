import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageAttachment {
  @IsString()
  type: string; // 'image' | 'file' | 'audio'

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  size?: number;
}

export class SendMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  groupId?: number;

  @IsOptional()
  @IsNumber()
  recipientId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachment)
  attachments?: MessageAttachment[];
}

export class MessageDto {
  id: string;
  content: string;
  sender: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  timestamp: number;
  attachments?: MessageAttachment[];
  readBy?: {
    userId: number;
    timestamp: number;
  }[];
}

export class ReadReceiptDto {
  @IsString()
  messageId: string;

  @IsOptional()
  @IsNumber()
  groupId?: number;

  @IsOptional()
  @IsNumber()
  senderId?: number;
}
