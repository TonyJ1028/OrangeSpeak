import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { Channel } from './entities/channel.entity';
import { Message } from './entities/message.entity';
import { AuthService } from './auth/auth.service';
import { ChannelsService } from './channels/channels.service';
import { MessagesService } from './messages/messages.service';
import { VoiceService } from './voice/voice.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', '123.136.93.165'),
        port: configService.get('DB_PORT', 33306),
        username: configService.get('DB_USERNAME', 'orangemessage'),
        password: configService.get('DB_PASSWORD', 'orangemessage'),
        database: configService.get('DB_NAME', 'orangemessage'),
        entities: [User, Channel, Message],
        synchronize: true, // 仅在开发环境使用
        charset: 'utf8mb4',
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Channel, Message]),
  ],
  providers: [
    AuthService,
    ChannelsService,
    MessagesService,
    VoiceService,
  ],
})
export class AppModule {} 