import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { Channel } from '../entities/channel.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(channelId: string, before?: string, limit: number = 50): Promise<Message[]> {
    const whereClause: any = { channel: { id: channelId } };
    if (before) {
      whereClause.id = LessThan(before);
    }

    return this.messageRepository.find({
      where: whereClause,
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async create(channelId: string, userId: string, content: string, type: string, metadata?: any): Promise<Message> {
    const channel = await this.channelRepository.findOne({ where: { id: channelId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const message = this.messageRepository.create({
      content,
      type,
      metadata,
      sender: user,
      channel,
    });

    return this.messageRepository.save(message);
  }

  async update(messageId: string, userId: string, content: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.id !== userId) {
      throw new NotFoundException('Unauthorized to edit this message');
    }

    message.content = content;
    return this.messageRepository.save(message);
  }

  async delete(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.id !== userId) {
      throw new NotFoundException('Unauthorized to delete this message');
    }

    await this.messageRepository.remove(message);
  }

  async search(channelId: string, query: string): Promise<Message[]> {
    return this.messageRepository
      .createQueryBuilder('message')
      .where('message.channelId = :channelId', { channelId })
      .andWhere('LOWER(message.content) LIKE LOWER(:query)', { query: `%${query}%` })
      .leftJoinAndSelect('message.sender', 'sender')
      .orderBy('message.createdAt', 'DESC')
      .take(50)
      .getMany();
  }
} 