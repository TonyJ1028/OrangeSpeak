import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VoiceService } from './voice.service';
import { VoiceChannel } from './entities/voice-channel.entity';
import { CreateVoiceChannelDto } from './dto/create-voice-channel.dto';
import { UpdateVoiceChannelDto } from './dto/update-voice-channel.dto';
import { UpdateVoiceControlDto } from './dto/voice-control.dto';

@ApiTags('voice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('channels')
  @ApiOperation({ summary: 'Create a new voice channel' })
  @ApiResponse({ status: 201, description: 'Channel created successfully', type: VoiceChannel })
  async createChannel(
    @Request() req,
    @Body() createChannelDto: CreateVoiceChannelDto,
  ) {
    return this.voiceService.createChannel(createChannelDto, req.user.id);
  }

  @Get('channels/group/:groupId')
  @ApiOperation({ summary: 'Get all voice channels in a group' })
  @ApiResponse({ status: 200, description: 'Returns all voice channels in the group', type: [VoiceChannel] })
  async getGroupChannels(
    @Request() req,
    @Param('groupId') groupId: string,
  ) {
    return this.voiceService.getChannelsInGroup(+groupId, req.user.id);
  }

  @Get('channels/:id')
  @ApiOperation({ summary: 'Get a voice channel by ID' })
  @ApiResponse({ status: 200, description: 'Returns the voice channel', type: VoiceChannel })
  async getChannel(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.voiceService.getChannel(+id);
  }

  @Patch('channels/:id')
  @ApiOperation({ summary: 'Update a voice channel' })
  @ApiResponse({ status: 200, description: 'Channel updated successfully', type: VoiceChannel })
  async updateChannel(
    @Request() req,
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateVoiceChannelDto,
  ) {
    return this.voiceService.updateChannel(+id, updateChannelDto, req.user.id);
  }

  @Delete('channels/:id')
  @ApiOperation({ summary: 'Delete a voice channel' })
  @ApiResponse({ status: 200, description: 'Channel deleted successfully' })
  async deleteChannel(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.voiceService.deleteChannel(+id, req.user.id);
  }

  @Post('channels/:id/join')
  @ApiOperation({ summary: 'Join a voice channel' })
  @ApiResponse({ status: 200, description: 'Successfully joined the channel' })
  async joinChannel(
    @Request() req,
    @Param('id') channelId: string,
  ) {
    return this.voiceService.joinChannel(+channelId, req.user.id);
  }

  @Post('channels/leave')
  @ApiOperation({ summary: 'Leave current voice channel' })
  @ApiResponse({ status: 200, description: 'Successfully left the channel' })
  async leaveChannel(@Request() req) {
    return this.voiceService.leaveChannel(req.user.id);
  }

  @Patch('control')
  @ApiOperation({ summary: 'Update user voice control settings' })
  @ApiResponse({ status: 200, description: 'Voice control settings updated successfully' })
  async updateVoiceControl(
    @Request() req,
    @Body() updateDto: UpdateVoiceControlDto,
  ) {
    return this.voiceService.updateVoiceControl(req.user.id, updateDto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current voice status' })
  @ApiResponse({ status: 200, description: 'Returns current voice status' })
  async getVoiceStatus(@Request() req) {
    const userState = this.voiceService.getUserVoiceState(req.user.id.toString());
    return {
      inChannel: !!userState,
      ...userState,
    };
  }
}
