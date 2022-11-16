import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { NodemailerService, QUEUE_EMAIL, QUEUE_EMAIL_SENDMAIL } from '@src/modules/nodemailer/nodemailer.service';
import { Job } from 'bull';

@Processor(QUEUE_EMAIL)
export class mailQueueProcessor {
  constructor(private readonly nodemailer: NodemailerService) {}

  @Process(QUEUE_EMAIL_SENDMAIL)
  async processFile(job: Job) {
    const data = job.data;
    await this.nodemailer.example();
  }
}
