import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsArray, IsString, IsOptional, MaxLength } from 'class-validator';
import { GroupRole, GroupPermission } from '../entities/group-member.entity';

export class UpdateGroupMemberDto {
  @ApiProperty({ enum: GroupRole, example: GroupRole.MEMBER, description: 'The role of the member' })
  @IsEnum(GroupRole)
  @IsOptional()
  role?: GroupRole;

  @ApiProperty({ type: [String], enum: GroupPermission, isArray: true, example: [GroupPermission.SPEAK], description: 'The permissions of the member' })
  @IsArray()
  @IsEnum(GroupPermission, { each: true })
  @IsOptional()
  permissions?: GroupPermission[];

  @ApiProperty({ example: 'Cool Guy', description: 'The nickname of the member in this group' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nickname?: string;
}

export class AddGroupMemberDto {
  @ApiProperty({ example: 1, description: 'The ID of the user to add' })
  userId: number;

  @ApiProperty({ enum: GroupRole, example: GroupRole.MEMBER, description: 'The initial role of the member' })
  @IsEnum(GroupRole)
  @IsOptional()
  role?: GroupRole = GroupRole.MEMBER;

  @ApiProperty({ example: 'Cool Guy', description: 'The initial nickname of the member' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nickname?: string;
}
