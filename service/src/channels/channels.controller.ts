import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';

@ApiTags('channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @ApiOperation({ summary: '获取所有频道' })
  @ApiResponse({ 
    status: 200, 
    description: '成功获取所有频道',
    type: [Channel]
  })
  @Get()
  async findAll(): Promise<Channel[]> {
    return this.channelsService.findAll();
  }

  @ApiOperation({ summary: '创建新频道' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '频道名称' },
        description: { type: 'string', description: '频道描述' },
        isVoiceChannel: { type: 'boolean', description: '是否为语音频道' }
      },
      required: ['name']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: '成功创建频道',
    type: Channel
  })
  @Post()
  async create(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('isVoiceChannel') isVoiceChannel: boolean
  ): Promise<Channel> {
    return this.channelsService.create(name, description, isVoiceChannel);
  }

  @ApiOperation({ summary: '加入频道' })
  @ApiResponse({ status: 200, description: '成功加入频道' })
  @ApiResponse({ status: 404, description: '频道或用户未找到' })
  @Post(':channelId/join/:userId')
  async join(
    @Param('channelId') channelId: string,
    @Param('userId') userId: string
  ): Promise<void> {
    await this.channelsService.join(channelId, userId);
  }

  @ApiOperation({ summary: '离开频道' })
  @ApiResponse({ status: 200, description: '成功离开频道' })
  @ApiResponse({ status: 404, description: '频道未找到' })
  @Delete(':channelId/leave/:userId')
  async leave(
    @Param('channelId') channelId: string,
    @Param('userId') userId: string
  ): Promise<void> {
    await this.channelsService.leave(channelId, userId);
  }

  @ApiOperation({ summary: '获取频道内的所有用户' })
  @ApiResponse({ 
    status: 200, 
    description: '��功获取频道用户列表',
    type: [User]
  })
  @ApiResponse({ status: 404, description: '频道未找到' })
  @Get(':channelId/users')
  async getUsers(@Param('channelId') channelId: string): Promise<User[]> {
    return this.channelsService.getUsers(channelId);
  }
} 