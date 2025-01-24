import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { QueueEnum } from '@/enums/queue.enum';
import { NodemailerService } from './nodemailer.service';

@Processor(QueueEnum.EMAIL_QUEUE)
export class MailQueueProcessor extends WorkerHost {
  constructor(private readonly nodemailer: NodemailerService) {
    super();
  }

  @OnWorkerEvent('completed')
  onCompleted(res: { jobId: string; returnvalue: string; prev?: string }) {
    console.log('🚀 ~ MailQueueProcessor ~ res:', res);
  }

  async process(job: Job, token?: string) {
    await this.nodemailer.example();
  }
}
