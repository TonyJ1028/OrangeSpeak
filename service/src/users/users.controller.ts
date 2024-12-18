import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User } from './user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile/:id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the user profile',
    type: User
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    delete user.password;
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('online')
  @ApiOperation({ summary: 'Get all online users' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the list of online users',
    type: [User]
  })
  async getOnlineUsers() {
    // Implementation for getting online users
    return [];
  }
}
