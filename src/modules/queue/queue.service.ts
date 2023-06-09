import { Queue } from 'bull';

import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';

export const TRANSCODING_QUEUE = 'transcode';

@Injectable()
export class QueueService {
    constructor(@InjectQueue() private queue: Queue) {}

    transcode() {
        void this.queue.add(TRANSCODING_QUEUE, {
            file: 'audio.mp3',
        });
    }
}
