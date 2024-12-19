import { Controller, Post, Body, Param, UseGuards, Get, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { VoiceService } from './voice.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('voice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @ApiOperation({ summary: '加入语音频道' })
  @ApiResponse({ status: 200, description: '成功加入语音频道' })
  @ApiResponse({ status: 404, description: '频道未找到' })
  @Post('join/:channelId')
  async joinVoiceChannel(
    @Param('channelId') channelId: string,
    @Body('userId') userId: string
  ): Promise<void> {
    await this.voiceService.joinVoiceChannel(channelId, userId);
  }

  @ApiOperation({ summary: '离开语音频道' })
  @ApiResponse({ status: 200, description: '成功离开语音频道' })
  @Delete('leave/:channelId')
  async leaveVoiceChannel(
    @Param('channelId') channelId: string,
    @Body('userId') userId: string
  ): Promise<void> {
    await this.voiceService.leaveVoiceChannel(channelId, userId);
  }

  @ApiOperation({ summary: '获取语音频道中的用户' })
  @ApiResponse({ 
    status: 200, 
    description: '成功获取语音频道用户列表',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: '用户ID' },
          username: { type: 'string', description: '用户名' },
          isMuted: { type: 'boolean', description: '是否静音' },
          isDeafened: { type: 'boolean', description: '是否耳机静音' }
        }
      }
    }
  })
  @Get(':channelId/users')
  async getVoiceChannelUsers(@Param('channelId') channelId: string) {
    return this.voiceService.getVoiceChannelUsers(channelId);
  }

  @ApiOperation({ summary: '切换用户静音状态' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '用户ID' },
        isMuted: { type: 'boolean', description: '是否静音' }
      },
      required: ['userId', 'isMuted']
    }
  })
  @ApiResponse({ status: 200, description: '成功切换静音状态' })
  @Post(':channelId/mute')
  async toggleMute(
    @Param('channelId') channelId: string,
    @Body('userId') userId: string,
    @Body('isMuted') isMuted: boolean
  ): Promise<void> {
    await this.voiceService.toggleMute(channelId, userId, isMuted);
  }

  @ApiOperation({ summary: '切换用户耳机静音状态' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '用户ID' },
        isDeafened: { type: 'boolean', description: '是否耳机静音' }
      },
      required: ['userId', 'isDeafened']
    }
  })
  @ApiResponse({ status: 200, description: '成功切换耳机静音状态' })
  @Post(':channelId/deafen')
  async toggleDeafen(
    @Param('channelId') channelId: string,
    @Body('userId') userId: string,
    @Body('isDeafened') isDeafened: boolean
  ): Promise<void> {
    await this.voiceService.toggleDeafen(channelId, userId, isDeafened);
  }
} 