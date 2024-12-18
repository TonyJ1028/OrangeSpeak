import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoiceChannel } from './entities/voice-channel.entity';
import { UsersService } from '../users/users.service';
import { MediasoupService } from './mediasoup.service';
import { GroupsService } from '../groups/groups.service';
import { CreateVoiceChannelDto } from './dto/create-voice-channel.dto';
import { UpdateVoiceChannelDto } from './dto/update-voice-channel.dto';
import { GroupPermission } from '../groups/entities/group-member.entity';
import { AudioSettingsDto } from './dto/audio-settings.dto';
import { UpdateVoiceControlDto } from './dto/voice-control.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private readonly channelUsers: Map<number, Set<string>> = new Map();
  private readonly userChannels: Map<string, number> = new Map();
  private readonly userVoiceStates: Map<string, {
    producerId?: string;
    consumerIds: string[];
    volume: number;
    muted: boolean;
    deafened: boolean;
    speaking: boolean;
    audioSettings: AudioSettingsDto;
  }> = new Map();

  private readonly defaultAudioSettings: AudioSettingsDto = {
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 2,
  };

  constructor(
    @InjectRepository(VoiceChannel)
    private voiceChannelRepository: Repository<VoiceChannel>,
    private usersService: UsersService,
    private groupsService: GroupsService,
    private mediasoupService: MediasoupService,
    private configService: ConfigService,
  ) {}

  async create(createVoiceChannelDto: CreateVoiceChannelDto) {
    const channel = this.voiceChannelRepository.create(createVoiceChannelDto);
    return await this.voiceChannelRepository.save(channel);
  }

  async findAll(groupId: number) {
    return await this.voiceChannelRepository.find({
      where: { groupId },
      relations: ['group'],
    });
  }

  async findOne(id: number) {
    const channel = await this.voiceChannelRepository.findOne({
      where: { id },
      relations: ['group'],
    });
    if (!channel) {
      throw new NotFoundException(`Voice channel #${id} not found`);
    }
    return channel;
  }

  async update(id: number, updateVoiceChannelDto: UpdateVoiceChannelDto) {
    const channel = await this.findOne(id);
    Object.assign(channel, updateVoiceChannelDto);
    return await this.voiceChannelRepository.save(channel);
  }

  async remove(id: number) {
    const channel = await this.findOne(id);
    await this.voiceChannelRepository.remove(channel);
  }

  async joinChannel(userId: string, channelId: number) {
    const channel = await this.findOne(channelId);
    const currentChannel = this.userChannels.get(userId);
    
    if (currentChannel) {
      await this.leaveChannel(userId);
    }

    // Check channel capacity
    const users = this.getChannelUsers(channelId);
    if (users.size >= channel.maxUsers) {
      throw new BadRequestException('Channel is full');
    }

    // Add user to channel
    users.add(userId);
    this.userChannels.set(userId, channelId);

    // Initialize voice state if not exists
    if (!this.userVoiceStates.has(userId)) {
      this.userVoiceStates.set(userId, {
        consumerIds: [],
        volume: 100,
        muted: false,
        deafened: false,
        speaking: false,
        audioSettings: { ...this.defaultAudioSettings },
      });
    }

    return {
      channelId,
      rtpCapabilities: this.mediasoupService.getRtpCapabilities(),
    };
  }

  async leaveChannel(userId: string) {
    const channelId = this.userChannels.get(userId);
    if (!channelId) return;

    // Remove user from channel
    const users = this.getChannelUsers(channelId);
    users.delete(userId);
    this.userChannels.delete(userId);

    // Cleanup user's mediasoup resources
    const state = this.userVoiceStates.get(userId);
    if (state) {
      if (state.producerId) {
        this.mediasoupService.closeProducer(state.producerId);
      }
      state.consumerIds.forEach(consumerId => {
        this.mediasoupService.closeConsumer(consumerId);
      });
      state.consumerIds = [];
    }

    // Remove empty channel users set
    if (users.size === 0) {
      this.channelUsers.delete(channelId);
    }

    return { channelId };
  }

  async createTransport(userId: string) {
    return await this.mediasoupService.createWebRtcTransport(userId);
  }

  async connectTransport(userId: string, dtlsParameters: any) {
    await this.mediasoupService.connectTransport(userId, dtlsParameters);
  }

  async produce(userId: string, transportId: string, rtpParameters: any) {
    const producer = await this.mediasoupService.createProducer(
      userId,
      transportId,
      rtpParameters,
    );

    const state = this.userVoiceStates.get(userId);
    if (state) {
      state.producerId = producer.id;
    }

    return producer;
  }

  async consume(userId: string, producerId: string, rtpCapabilities: any) {
    const result = await this.mediasoupService.createConsumer(
      userId,
      producerId,
      rtpCapabilities,
    );

    const state = this.userVoiceStates.get(userId);
    if (state) {
      state.consumerIds.push(result.consumer.id);
    }

    return result;
  }

  async resumeConsumer(consumerId: string) {
    await this.mediasoupService.resumeConsumer(consumerId);
  }

  getChannelUsers(channelId: number): Set<string> {
    if (!this.channelUsers.has(channelId)) {
      this.channelUsers.set(channelId, new Set());
    }
    return this.channelUsers.get(channelId);
  }

  getUserChannel(userId: string): number | undefined {
    return this.userChannels.get(userId);
  }

  async updateVoiceState(userId: string, update: Partial<UpdateVoiceControlDto>) {
    const state = this.userVoiceStates.get(userId);
    if (!state) {
      throw new NotFoundException('User voice state not found');
    }

    Object.assign(state, update);
    return state;
  }

  async updateUserAudioSettings(userId: string, settings: AudioSettingsDto) {
    return this.updateAudioSettings(userId, settings);
  }

  async updateAudioSettings(userId: string, settings: AudioSettingsDto) {
    const state = this.userVoiceStates.get(userId);
    if (!state) {
      throw new NotFoundException('User voice state not found');
    }

    state.audioSettings = { ...state.audioSettings, ...settings };
    return state.audioSettings;
  }

  getAudioSettings(userId: string): AudioSettingsDto {
    const state = this.userVoiceStates.get(userId);
    return state?.audioSettings || { ...this.defaultAudioSettings };
  }

  async cleanup() {
    await this.mediasoupService.cleanup();
    this.channelUsers.clear();
    this.userChannels.clear();
    this.userVoiceStates.clear();
  }
}
