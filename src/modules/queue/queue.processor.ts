import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { TRANSCODING_QUEUE } from './queue.service';

@Processor()
export class QueueProcessor {
  @Process(TRANSCODING_QUEUE)
  transcode({ data }: Job) {
    console.log(data);
  }
}
