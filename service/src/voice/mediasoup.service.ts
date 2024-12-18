import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import { Worker, Router, WebRtcTransport, Producer, Consumer, RtpCodecCapability } from 'mediasoup/node/lib/types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediasoupService implements OnModuleInit {
  private worker: Worker;
  private router: Router;
  private readonly transports: Map<string, WebRtcTransport> = new Map();
  private readonly producers: Map<string, Producer> = new Map();
  private readonly consumers: Map<string, Consumer> = new Map();
  private readonly logger = new Logger(MediasoupService.name);

  constructor(private configService: ConfigService) {}

  private readonly mediaCodecs: RtpCodecCapability[] = [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
      parameters: {
        minptime: 10,
        useinbandfec: 1,
      },
    },
  ];

  async onModuleInit() {
    try {
      this.worker = await mediasoup.createWorker({
        logLevel: 'warn',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
        rtcMinPort: this.configService.get('voice.rtcMinPort'),
        rtcMaxPort: this.configService.get('voice.rtcMaxPort'),
      });

      this.worker.on('died', () => {
        this.logger.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', this.worker.pid);
        setTimeout(() => process.exit(1), 2000);
      });

      this.router = await this.worker.createRouter({ mediaCodecs: this.mediaCodecs });
      this.logger.log('mediasoup worker and router created successfully');
    } catch (error) {
      this.logger.error('Failed to create mediasoup worker', error);
      throw error;
    }
  }

  async createWebRtcTransport(userId: string): Promise<{
    transport: WebRtcTransport;
    params: any;
  }> {
    const transport = await this.router.createWebRtcTransport({
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: this.configService.get('voice.announcedIp') || '127.0.0.1',
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 800000,
    });

    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'closed') {
        transport.close();
      }
    });

    transport.on('close', () => {
      this.logger.log('transport closed', { userId });
      this.transports.delete(userId);
    });

    this.transports.set(userId, transport);

    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  }

  async connectTransport(userId: string, dtlsParameters: any): Promise<void> {
    const transport = this.transports.get(userId);
    if (!transport) {
      throw new Error('Transport not found');
    }

    await transport.connect({ dtlsParameters });
  }

  async createProducer(
    userId: string,
    transportId: string,
    rtpParameters: any,
  ): Promise<Producer> {
    const transport = this.transports.get(userId);
    if (!transport) {
      throw new Error('Transport not found');
    }

    const producer = await transport.produce({
      kind: 'audio',
      rtpParameters,
    });

    producer.on('transportclose', () => {
      this.producers.delete(producer.id);
    });

    this.producers.set(producer.id, producer);
    return producer;
  }

  async createConsumer(
    userId: string,
    producerId: string,
    rtpCapabilities: any,
  ): Promise<{
    consumer: Consumer;
    params: any;
  }> {
    if (!this.router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error('Cannot consume');
    }

    const transport = this.transports.get(userId);
    if (!transport) {
      throw new Error('Transport not found');
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true,
    });

    consumer.on('transportclose', () => {
      this.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', () => {
      this.consumers.delete(consumer.id);
    });

    this.consumers.set(consumer.id, consumer);

    return {
      consumer,
      params: {
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      },
    };
  }

  async resumeConsumer(consumerId: string): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    if (!consumer) {
      throw new Error('Consumer not found');
    }
    await consumer.resume();
  }

  getRtpCapabilities(): any {
    return this.router.rtpCapabilities;
  }

  closeTransport(userId: string): void {
    const transport = this.transports.get(userId);
    if (transport) {
      transport.close();
      this.transports.delete(userId);
    }
  }

  closeProducer(producerId: string): void {
    const producer = this.producers.get(producerId);
    if (producer) {
      producer.close();
      this.producers.delete(producerId);
    }
  }

  closeConsumer(consumerId: string): void {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumerId);
    }
  }

  getTransportsCount(): number {
    return this.transports.size;
  }

  getProducersCount(): number {
    return this.producers.size;
  }

  getConsumersCount(): number {
    return this.consumers.size;
  }

  async cleanup(): Promise<void> {
    this.transports.forEach((transport) => transport.close());
    this.producers.forEach((producer) => producer.close());
    this.consumers.forEach((consumer) => consumer.close());

    this.transports.clear();
    this.producers.clear();
    this.consumers.clear();

    if (this.router) {
      this.router.close();
    }

    if (this.worker) {
      await this.worker.close();
    }
  }
}
