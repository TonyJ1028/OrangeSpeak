import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Message } from '../entities/message.entity';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({ summary: '获取频道的消息' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '限制返回的消息数量' })
  @ApiQuery({ name: 'before', required: false, type: String, description: '获取此消息ID之前的消息' })
  @ApiResponse({ 
    status: 200, 
    description: '成功获取消息列表',
    type: [Message]
  })
  @Get('channel/:channelId')
  async getChannelMessages(
    @Param('channelId') channelId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string
  ): Promise<Message[]> {
    return this.messagesService.getChannelMessages(channelId, limit, before);
  }

  @ApiOperation({ summary: '发送消息到频道' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: '消息内容' },
        userId: { type: 'string', description: '发送者ID' }
      },
      required: ['content', 'userId']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: '成功发送消息',
    type: Message
  })
  @Post('channel/:channelId')
  async sendMessage(
    @Param('channelId') channelId: string,
    @Body('content') content: string,
    @Body('userId') userId: string
  ): Promise<Message> {
    return this.messagesService.createMessage(channelId, userId, content);
  }

  @ApiOperation({ summary: '获取单条消息' })
  @ApiResponse({ 
    status: 200, 
    description: '成功获取消息',
    type: Message
  })
  @ApiResponse({ status: 404, description: '消息未找到' })
  @Get(':messageId')
  async getMessage(@Param('messageId') messageId: string): Promise<Message> {
    return this.messagesService.getMessage(messageId);
  }

  @ApiOperation({ summary: '获取用户的所有消息' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '限制返回的消息数量' })
  @ApiResponse({ 
    status: 200, 
    description: '成功���取用户消息列表',
    type: [Message]
  })
  @Get('user/:userId')
  async getUserMessages(
    @Param('userId') userId: string,
    @Query('limit') limit?: number
  ): Promise<Message[]> {
    return this.messagesService.getUserMessages(userId, limit);
  }
} 