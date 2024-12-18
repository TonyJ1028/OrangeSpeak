import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateVoiceControlDto {
  @ApiProperty({ example: 1, description: 'ID of the voice channel' })
  @IsNumber()
  channelId: number;

  @ApiProperty({ example: true, description: 'Whether to mute the user', required: false })
  @IsBoolean()
  @IsOptional()
  isMuted?: boolean;

  @ApiProperty({ example: true, description: 'Whether to deafen the user', required: false })
  @IsBoolean()
  @IsOptional()
  isDeafened?: boolean;

  @ApiProperty({ example: 0.5, description: 'Input volume multiplier (0.0 to 2.0)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0.0)
  @Max(2.0)
  inputVolume?: number;

  @ApiProperty({ example: 0.5, description: 'Output volume multiplier (0.0 to 2.0)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0.0)
  @Max(2.0)
  outputVolume?: number;
}
