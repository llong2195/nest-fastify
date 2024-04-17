import { MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

import { LoggerService } from '@logger/custom.logger';
import { QueueEnum, TopicEnum } from '../../enums/queue.enum';

@Injectable()
export class NodemailerService {
  constructor(
    private readonly mailerService: MailerService,
    @InjectQueue(QueueEnum.EMAIL_QUEUE) private queueMail: Queue,
  ) {}

  public async example(): Promise<void> {
    this.mailerService
      .sendMail({
        to: 'email@gmail.com',
        from: 'noreply@nestjs.com',
        subject: 'Testing Nest Mailermodule with template ✔',
        template: 'welcome',
        context: {
          // Data to be sent to template engine.
        },
      })
      .catch(e => {
        LoggerService.error(e);
      });
  }

  async sendMailwithQueue(data: string) {
    try {
      const job = await this.queueMail.add(TopicEnum.EMAIL_SENDMAIL, {
        data: data,
      });
      return job.id;
    } catch (e) {
      LoggerService.error(e);
      throw e;
    }
  }
}
