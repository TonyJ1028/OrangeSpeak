import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class AudioEffectSettings {
  @ApiProperty({ example: true, description: 'Enable noise suppression' })
  @IsBoolean()
  @IsOptional()
  noiseSuppression?: boolean;

  @ApiProperty({ example: true, description: 'Enable echo cancellation' })
  @IsBoolean()
  @IsOptional()
  echoCancellation?: boolean;

  @ApiProperty({ example: true, description: 'Enable auto gain control' })
  @IsBoolean()
  @IsOptional()
  autoGainControl?: boolean;

  @ApiProperty({ example: 48000, description: 'Sample rate in Hz' })
  @IsNumber()
  @IsOptional()
  sampleRate?: number;

  @ApiProperty({ example: 2, description: 'Number of audio channels' })
  @IsNumber()
  @IsOptional()
  channelCount?: number;
}
