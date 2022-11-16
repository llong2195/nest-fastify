import { Global, Module } from '@nestjs/common';
import { NodemailerService, QUEUE_EMAIL } from './nodemailer.service';
import { NodemailerController } from './nodemailer.controller';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bull';
import { mailQueueProcessor } from '@src/modules/nodemailer/mailQueue.process';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        ({
          transport: {
            // name: config.get<string>('NODEMAILER_HOST'),
            host: config.get<string>('NODEMAILER_HOST'),
            secure: config.get<boolean>('NODEMAILER_SECURE'),
            port: config.get<number>('NODEMAILER_PORT') || 465,
            auth: {
              user: config.get<string>('NODEMAILER_USER'),
              pass: config.get<string>('NODEMAILER_PASS'),
            },
          },
          defaults: {
            from: `"No Reply" <no-reply@localhost>' <${config.get<string>('NODEMAILER_FROM')}>`,
          },
          preview: false, // true
          template: {
            dir: join(__dirname, './../../../public/templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        } as MailerOptions),
    }),
    BullModule.registerQueue({
      name: QUEUE_EMAIL,
    }),
  ],
  controllers: [NodemailerController],
  providers: [NodemailerService, mailQueueProcessor],
})
export class NodemailerModule {}
