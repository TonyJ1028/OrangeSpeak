import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceChannel } from './entities/voice-channel.entity';
import { VoiceService } from './voice.service';
import { VoiceController } from './voice.controller';
import { VoiceGateway } from './voice.gateway';
import { UsersModule } from '../users/users.module';
import { MediasoupService } from './mediasoup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VoiceChannel]),
    UsersModule,
  ],
  providers: [VoiceService, VoiceGateway, MediasoupService],
  controllers: [VoiceController],
  exports: [VoiceService],
})
export class VoiceModule {}
