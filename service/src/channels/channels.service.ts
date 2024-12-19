import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../entities/channel.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Channel[]> {
    return this.channelRepository.find();
  }

  async create(name: string, description: string, isVoiceChannel: boolean): Promise<Channel> {
    const channel = this.channelRepository.create({
      name,
      description,
      isVoiceChannel,
    });
    return this.channelRepository.save(channel);
  }

  async join(channelId: string, userId: string): Promise<void> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['users'],
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!channel.users) {
      channel.users = [];
    }
    channel.users.push(user);
    await this.channelRepository.save(channel);
  }

  async leave(channelId: string, userId: string): Promise<void> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['users'],
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    channel.users = channel.users.filter(user => user.id !== userId);
    await this.channelRepository.save(channel);
  }

  async getUsers(channelId: string): Promise<User[]> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['users'],
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    return channel.users;
  }
} 