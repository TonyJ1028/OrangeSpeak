import { Controller, Get, Post, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ReadReceiptDto } from './dto/read-receipt.dto';
import { Message } from './entities/message.entity';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @ApiOperation({ summary: 'Send a new message' })
  @ApiResponse({ 
    status: 201, 
    description: 'Message sent successfully',
    type: Message
  })
  async sendMessage(
    @Request() req,
    @Body() sendMessageDto: SendMessageDto
  ) {
    return this.chatService.sendMessage(req.user.id, sendMessageDto);
  }

  @Get('messages/group/:groupId')
  @ApiOperation({ summary: 'Get messages from a group' })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of messages to return (default: 50)'
  })
  @ApiQuery({ 
    name: 'before', 
    required: false, 
    type: Date,
    description: 'Get messages before this timestamp'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns group messages',
    type: [Message]
  })
  async getGroupMessages(
    @Request() req,
    @Param('groupId') groupId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: Date
  ) {
    return this.chatService.getGroupMessages(+groupId, req.user.id, { limit, before });
  }

  @Get('messages/direct/:userId')
  @ApiOperation({ summary: 'Get direct messages with a user' })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of messages to return (default: 50)'
  })
  @ApiQuery({ 
    name: 'before', 
    required: false, 
    type: Date,
    description: 'Get messages before this timestamp'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns direct messages',
    type: [Message]
  })
  async getDirectMessages(
    @Request() req,
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: Date
  ) {
    return this.chatService.getDirectMessages(req.user.id, +userId, { limit, before });
  }

  @Post('messages/:messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiResponse({ 
    status: 200, 
    description: 'Message marked as read successfully'
  })
  async markMessageAsRead(
    @Request() req,
    @Param('messageId') messageId: string,
    @Body() readReceiptDto: ReadReceiptDto
  ) {
    return this.chatService.markMessageAsRead(req.user.id, +messageId, readReceiptDto);
  }

  @Get('typing/group/:groupId')
  @ApiOperation({ summary: 'Get users typing in a group' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns list of users currently typing',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'number' },
          username: { type: 'string' }
        }
      }
    }
  })
  async getGroupTypingUsers(
    @Request() req,
    @Param('groupId') groupId: string
  ) {
    return this.chatService.getGroupTypingUsers(+groupId);
  }

  @Get('typing/direct/:userId')
  @ApiOperation({ summary: 'Check if user is typing in direct chat' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns typing status',
    schema: {
      type: 'object',
      properties: {
        isTyping: { type: 'boolean' },
        lastTyped: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getUserTypingStatus(
    @Request() req,
    @Param('userId') userId: string
  ) {
    return this.chatService.getUserTypingStatus(+userId);
  }
}
