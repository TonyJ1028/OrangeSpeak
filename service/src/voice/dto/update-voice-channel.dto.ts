import { PartialType } from '@nestjs/swagger';
import { CreateVoiceChannelDto } from './create-voice-channel.dto';

export class UpdateVoiceChannelDto extends PartialType(CreateVoiceChannelDto) {}
