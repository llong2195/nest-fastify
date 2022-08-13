import appConfig from '@config/app.config';
import authConfig from '@config/auth.config';
import databaseConfig from '@config/database.config';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { REDIS_HOST, REDIS_PORT } from './config';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { AllExceptionFilter } from './filter/exception.filter';
import { CronModule } from './modules/cron/cron.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { UploadFileModule } from './modules/upload-file/upload-file.module';
import { ValidatorsModule } from './validators/validators.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('THROTTLE_TTL'),
        limit: config.get<number>('THROTTLE_LIMIT'),
      }),
    }),

    BullModule.forRoot({
      redis: {
        host: REDIS_HOST || 'localhost',
        port: Number(REDIS_PORT) || 6379,
      },
    }),
    LoggerModule,
    DatabaseModule,
    CronModule,
    AuthModule,
    UserModule,
    UploadFileModule,
    ValidatorsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    AppService,
  ],
})
export class AppModule {}
