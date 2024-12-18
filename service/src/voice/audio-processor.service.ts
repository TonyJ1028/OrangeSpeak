import { Injectable } from '@nestjs/common';
import { Producer } from 'mediasoup/node/lib/types';
import { AudioEffectSettings } from './dto/audio-effect-settings.dto';

@Injectable()
export class AudioProcessorService {
  private readonly defaultSettings: AudioEffectSettings = {
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 2,
  };

  private readonly producerSettings: Map<string, AudioEffectSettings> = new Map();

  getDefaultSettings(): AudioEffectSettings {
    return { ...this.defaultSettings };
  }

  async updateProducerSettings(
    producerId: string,
    settings: Partial<AudioEffectSettings>,
  ): Promise<AudioEffectSettings> {
    const currentSettings = this.producerSettings.get(producerId) || { ...this.defaultSettings };
    const newSettings = { ...currentSettings, ...settings };
    this.producerSettings.set(producerId, newSettings);
    return newSettings;
  }

  getProducerSettings(producerId: string): AudioEffectSettings {
    return this.producerSettings.get(producerId) || { ...this.defaultSettings };
  }

  async applyAudioEffects(producer: Producer, settings: AudioEffectSettings): Promise<void> {
    const rtpParameters = producer.rtpParameters;

    // Update codec parameters based on settings
    if (rtpParameters.codecs[0].mimeType.toLowerCase() === 'audio/opus') {
      const codecOptions = {
        useinbandfec: 1, // Forward Error Correction
        usedtx: 1,      // Discontinuous Transmission
        'sprop-stereo': settings.channelCount === 2 ? 1 : 0,
        maxplaybackrate: settings.sampleRate,
        maxaveragebitrate: this.calculateBitrate(settings),
        stereo: settings.channelCount === 2 ? 1 : 0,
      };

      // Apply codec options
      await producer.setCodecOptions(codecOptions);
    }

    // Apply RTP header extensions
    const rtpHeaderExtensions = {
      'urn:ietf:params:rtp-hdrext:ssrc-audio-level': true,
      'http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time': true,
    };

    // Set RTP header extensions
    await producer.setRtpHeaderExtensions(rtpHeaderExtensions);
  }

  private calculateBitrate(settings: AudioEffectSettings): number {
    // Base bitrate calculation based on sample rate
    let baseBitrate = settings.sampleRate * 16; // Assuming 16-bit audio
    
    // Adjust for stereo if needed
    if (settings.channelCount === 2) {
      baseBitrate *= 2;
    }

    // Convert to kbps and apply quality factors
    let targetBitrate = Math.floor(baseBitrate / 1000);

    // Apply reduction factors based on enabled effects
    if (settings.noiseSuppression) targetBitrate *= 0.95;
    if (settings.echoCancellation) targetBitrate *= 0.95;
    if (settings.autoGainControl) targetBitrate *= 0.98;

    // Ensure minimum and maximum bitrates
    return Math.max(16000, Math.min(128000, targetBitrate));
  }

  generateAudioConstraints(settings: AudioEffectSettings): MediaTrackConstraints {
    return {
      noiseSuppression: settings.noiseSuppression,
      echoCancellation: settings.echoCancellation,
      autoGainControl: settings.autoGainControl,
      channelCount: settings.channelCount,
      sampleRate: settings.sampleRate,
    };
  }
}
