import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { QueueEnum, TopicEnum } from '@/enums/queue.enum';
import { NodemailerService } from './nodemailer.service';

@Processor(QueueEnum.EMAIL_QUEUE)
export class mailQueueProcessor {
  constructor(private readonly nodemailer: NodemailerService) {}

  @Process(TopicEnum.EMAIL_SENDMAIL)
  async processFile(job: Job) {
    await this.nodemailer.example();
  }
}
