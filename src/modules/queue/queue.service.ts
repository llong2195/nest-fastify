import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

export const TRANSCODING_QUEUE = 'transcode';

@Injectable()
export class QueueService {
  constructor(@InjectQueue() private queue: Queue) {}

  async transcode() {
    await this.queue.add(TRANSCODING_QUEUE, {
      file: 'audio.mp3',
    });
  }
}
