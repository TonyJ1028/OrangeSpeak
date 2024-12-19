import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import { Worker, Router, WebRtcTransport, Producer, Consumer, MediaKind } from 'mediasoup/node/lib/types';

@Injectable()
export class VoiceService implements OnModuleInit {
  private worker: Worker;
  private router: Router;
  private rooms: Map<string, {
    router: Router;
    transports: Map<string, WebRtcTransport>;
    producers: Map<string, Producer>;
    consumers: Map<string, Consumer>;
  }> = new Map();

  async onModuleInit() {
    this.worker = await mediasoup.createWorker({
      logLevel: 'warn',
      rtcMinPort: 10000,
      rtcMaxPort: 10100,
    });

    this.router = await this.worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
      ],
    });
  }

  async createRoom(roomId: string) {
    if (!this.rooms.has(roomId)) {
      const router = await this.worker.createRouter({
        mediaCodecs: [
          {
            kind: 'audio',
            mimeType: 'audio/opus',
            clockRate: 48000,
            channels: 2,
          },
        ],
      });

      this.rooms.set(roomId, {
        router,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
      });
    }
    return this.rooms.get(roomId);
  }

  async createWebRtcTransport(roomId: string, userId: string) {
    const room = await this.createRoom(roomId);
    
    const transport = await room.router.createWebRtcTransport({
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: '127.0.0.1', // 在生产环境中需要替换为实际的公网IP
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    room.transports.set(userId, transport);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  async connectTransport(roomId: string, userId: string, dtlsParameters: any) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const transport = room.transports.get(userId);
    if (!transport) {
      throw new Error('Transport not found');
    }

    await transport.connect({ dtlsParameters });
  }

  async produce(roomId: string, userId: string, kind: MediaKind, rtpParameters: any) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const transport = room.transports.get(userId);
    if (!transport) {
      throw new Error('Transport not found');
    }

    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    room.producers.set(producer.id, producer);

    return { id: producer.id };
  }

  async consume(roomId: string, userId: string, producerId: string, rtpCapabilities: any) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const transport = room.transports.get(userId);
    if (!transport) {
      throw new Error('Transport not found');
    }

    if (!room.router.canConsume({
      producerId,
      rtpCapabilities,
    })) {
      throw new Error('Cannot consume');
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
    });

    room.consumers.set(consumer.id, consumer);

    return {
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }

  async closeRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.consumers.forEach(consumer => consumer.close());
      room.producers.forEach(producer => producer.close());
      room.transports.forEach(transport => transport.close());
      room.router.close();
      this.rooms.delete(roomId);
    }
  }

  getRtpCapabilities(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    return room.router.rtpCapabilities;
  }
} 