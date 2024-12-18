import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FriendshipService } from './friendship.service';
import { CreateFriendRequestDto, UpdateFriendshipDto } from './dto/friendship.dto';
import { FriendshipStatus } from './entities/friendship.entity';

@ApiTags('friendships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friendships')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Post('requests')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiResponse({ status: 201, description: 'The friend request has been successfully sent.' })
  async sendFriendRequest(
    @Request() req,
    @Body() createFriendRequestDto: CreateFriendRequestDto,
  ) {
    return this.friendshipService.sendFriendRequest(req.user.id, createFriendRequestDto);
  }

  @Post('requests/:id/accept')
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiResponse({ status: 200, description: 'The friend request has been successfully accepted.' })
  async acceptFriendRequest(@Request() req, @Param('id') id: string) {
    return this.friendshipService.respondToFriendRequest(req.user.id, +id, FriendshipStatus.ACCEPTED);
  }

  @Post('requests/:id/reject')
  @ApiOperation({ summary: 'Reject a friend request' })
  @ApiResponse({ status: 200, description: 'The friend request has been successfully rejected.' })
  async rejectFriendRequest(@Request() req, @Param('id') id: string) {
    return this.friendshipService.respondToFriendRequest(req.user.id, +id, FriendshipStatus.BLOCKED);
  }

  @Get('friends')
  @ApiOperation({ summary: 'Get all friends' })
  @ApiResponse({ status: 200, description: 'Return all friends of the current user.' })
  async getFriends(@Request() req) {
    return this.friendshipService.getFriends(req.user.id);
  }

  @Get('requests/pending')
  @ApiOperation({ summary: 'Get pending friend requests' })
  @ApiResponse({ status: 200, description: 'Return all pending friend requests.' })
  async getPendingRequests(@Request() req) {
    return this.friendshipService.getPendingRequests(req.user.id);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Get sent friend requests' })
  @ApiResponse({ status: 200, description: 'Return all sent friend requests.' })
  async getSentRequests(@Request() req) {
    return this.friendshipService.getSentRequests(req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a friendship' })
  @ApiResponse({ status: 200, description: 'The friendship has been successfully updated.' })
  async updateFriendship(
    @Request() req,
    @Param('id') id: string,
    @Body() updateFriendshipDto: UpdateFriendshipDto,
  ) {
    return this.friendshipService.updateFriendship(req.user.id, +id, updateFriendshipDto);
  }

  @Post('block/:id')
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({ status: 200, description: 'The user has been successfully blocked.' })
  async blockUser(@Request() req, @Param('id') id: string) {
    return this.friendshipService.blockUser(req.user.id, +id);
  }

  @Delete('block/:id')
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({ status: 200, description: 'The user has been successfully unblocked.' })
  async unblockUser(@Request() req, @Param('id') id: string) {
    return this.friendshipService.unblockUser(req.user.id, +id);
  }

  @Get('blocked')
  @ApiOperation({ summary: 'Get blocked users' })
  @ApiResponse({ status: 200, description: 'Return all blocked users.' })
  async getBlockedUsers(@Request() req) {
    return this.friendshipService.getBlockedUsers(req.user.id);
  }
}
