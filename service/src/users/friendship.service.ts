import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import { CreateFriendRequestDto, UpdateFriendshipDto } from './dto/friendship.dto';
import { UsersService } from './users.service';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    private usersService: UsersService,
  ) {}

  async sendFriendRequest(userId: number, createFriendRequestDto: CreateFriendRequestDto) {
    // 检查接收者是否存在
    const receiver = await this.usersService.findOne(createFriendRequestDto.receiverId);
    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    // 检查是否已经是好友
    const existingFriendship = await this.friendshipRepository.findOne({
      where: [
        { sender: { id: userId }, receiver: { id: createFriendRequestDto.receiverId } },
        { sender: { id: createFriendRequestDto.receiverId }, receiver: { id: userId } },
      ],
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException('Users are already friends');
      }
      if (existingFriendship.status === FriendshipStatus.PENDING) {
        throw new BadRequestException('Friend request already sent');
      }
      if (existingFriendship.status === FriendshipStatus.BLOCKED) {
        throw new BadRequestException('Cannot send friend request to blocked user');
      }
    }

    // 创建好友请求
    const friendship = this.friendshipRepository.create({
      sender: { id: userId },
      receiver: { id: createFriendRequestDto.receiverId },
      status: FriendshipStatus.PENDING,
      nickname: createFriendRequestDto.nickname,
      notes: createFriendRequestDto.notes,
    });

    return this.friendshipRepository.save(friendship);
  }

  async respondToFriendRequest(userId: number, friendshipId: number, status: FriendshipStatus) {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId, receiver: { id: userId }, status: FriendshipStatus.PENDING },
      relations: ['sender', 'receiver'],
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    friendship.status = status;
    return this.friendshipRepository.save(friendship);
  }

  async updateFriendship(userId: number, friendshipId: number, updateFriendshipDto: UpdateFriendshipDto) {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        { id: friendshipId, sender: { id: userId } },
        { id: friendshipId, receiver: { id: userId } },
      ],
      relations: ['sender', 'receiver'],
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // 只有接收者可以更改状态
    if (updateFriendshipDto.status && friendship.receiver.id !== userId) {
      throw new BadRequestException('Only the receiver can change the friendship status');
    }

    Object.assign(friendship, updateFriendshipDto);
    return this.friendshipRepository.save(friendship);
  }

  async getFriends(userId: number) {
    const friendships = await this.friendshipRepository.find({
      where: [
        { sender: { id: userId }, status: FriendshipStatus.ACCEPTED },
        { receiver: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['sender', 'receiver'],
    });

    return friendships.map(friendship => {
      const friend = friendship.sender.id === userId ? friendship.receiver : friendship.sender;
      return {
        ...friendship,
        friend,
      };
    });
  }

  async getPendingRequests(userId: number) {
    return this.friendshipRepository.find({
      where: { receiver: { id: userId }, status: FriendshipStatus.PENDING },
      relations: ['sender'],
    });
  }

  async getSentRequests(userId: number) {
    return this.friendshipRepository.find({
      where: { sender: { id: userId }, status: FriendshipStatus.PENDING },
      relations: ['receiver'],
    });
  }

  async blockUser(userId: number, targetUserId: number) {
    let friendship = await this.friendshipRepository.findOne({
      where: [
        { sender: { id: userId }, receiver: { id: targetUserId } },
        { sender: { id: targetUserId }, receiver: { id: userId } },
      ],
    });

    if (!friendship) {
      friendship = this.friendshipRepository.create({
        sender: { id: userId },
        receiver: { id: targetUserId },
      });
    }

    friendship.status = FriendshipStatus.BLOCKED;
    return this.friendshipRepository.save(friendship);
  }

  async unblockUser(userId: number, targetUserId: number) {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        { sender: { id: userId }, receiver: { id: targetUserId }, status: FriendshipStatus.BLOCKED },
        { sender: { id: targetUserId }, receiver: { id: userId }, status: FriendshipStatus.BLOCKED },
      ],
    });

    if (!friendship) {
      throw new NotFoundException('Block relationship not found');
    }

    await this.friendshipRepository.remove(friendship);
  }

  async getBlockedUsers(userId: number) {
    return this.friendshipRepository.find({
      where: [
        { sender: { id: userId }, status: FriendshipStatus.BLOCKED },
        { receiver: { id: userId }, status: FriendshipStatus.BLOCKED },
      ],
      relations: ['sender', 'receiver'],
    });
  }
}
