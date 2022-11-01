import { Global, Module } from '@nestjs/common';
import { NodemailerService } from './nodemailer.service';
import { NodemailerController } from './nodemailer.controller';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        ({
          transport: {
            name: config.get<string>('MAIL_HOST'),
            host: config.get<number>('MAIL_HOST'),
            secure: true,
            port: config.get<number>('MAIL_PORT') || 465,
            auth: {
              user: config.get<string>('MAIL_USER'),
              pass: config.get<string>('MAIL_PASSWORD'),
            },
          },
          defaults: {
            from: `"No Reply" <no-reply@localhost>' <${config.get<string>('MAIL_FROM')}>`,
          },
          preview: true,
          template: {
            dir: join(__dirname, '../../templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        } as MailerOptions),
    }),
  ],
  controllers: [NodemailerController],
  providers: [NodemailerService],
})
export class NodemailerModule {}
