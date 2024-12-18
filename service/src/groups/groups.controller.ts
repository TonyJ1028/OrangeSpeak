import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddGroupMemberDto, UpdateGroupMemberDto } from './dto/group-member.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GroupPermissionGuard } from '../auth/guards/group-permission.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'The group has been successfully created.' })
  async create(@Request() req, @Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto, req.user.id);
  }

  @Get()
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Get all groups for the current user' })
  @ApiResponse({ status: 200, description: 'Return all groups the user is a member of.' })
  async findAll(@Request() req) {
    return this.groupsService.findAll(req.user.id);
  }

  @Get('public')
  @ApiOperation({ summary: 'Search public groups' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for group name or description' })
  @ApiResponse({ status: 200, description: 'Return public groups matching the search criteria.' })
  async searchPublicGroups(@Query('search') search?: string) {
    // TODO: Implement search functionality in GroupsService
    return this.groupsService.searchPublicGroups(search);
  }

  @Get(':id')
  @UseGuards(GroupPermissionGuard)
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Get a specific group' })
  @ApiResponse({ status: 200, description: 'Return the group.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.groupsService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(GroupPermissionGuard)
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Update a group' })
  @ApiResponse({ status: 200, description: 'The group has been successfully updated.' })
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @Request() req,
  ) {
    return this.groupsService.update(+id, updateGroupDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(GroupPermissionGuard)
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Delete a group' })
  @ApiResponse({ status: 200, description: 'The group has been successfully deleted.' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.groupsService.remove(+id, req.user.id);
  }

  @Post(':id/members')
  @UseGuards(GroupPermissionGuard)
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Add a member to the group' })
  @ApiResponse({ status: 201, description: 'The member has been successfully added to the group.' })
  async addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddGroupMemberDto,
    @Request() req,
  ) {
    return this.groupsService.addMember(+id, addMemberDto, req.user.id);
  }

  @Patch(':groupId/members/:memberId')
  @UseGuards(GroupPermissionGuard)
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Update a group member' })
  @ApiResponse({ status: 200, description: 'The group member has been successfully updated.' })
  async updateMember(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @Body() updateMemberDto: UpdateGroupMemberDto,
    @Request() req,
  ) {
    return this.groupsService.updateMember(+groupId, +memberId, updateMemberDto, req.user.id);
  }

  @Delete(':groupId/members/:memberId')
  @UseGuards(GroupPermissionGuard)
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Remove a member from the group' })
  @ApiResponse({ status: 200, description: 'The member has been successfully removed from the group.' })
  async removeMember(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    return this.groupsService.removeMember(+groupId, +memberId, req.user.id);
  }

  @Get(':id/channels')
  @ApiOperation({ summary: 'Get all voice channels in a group' })
  @ApiResponse({ status: 200, description: 'Return all voice channels in the group.' })
  async getChannels(@Param('id') id: string, @Request() req) {
    return this.groupsService.getVoiceChannels(+id, req.user.id);
  }
}
