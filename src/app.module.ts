import appConfig from '@config/app.config';
import authConfig from '@config/auth.config';
import databaseConfig from '@config/database.config';
import { BullModule, BullRootModuleOptions } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { AllExceptionFilter } from './filter/exception.filter';
import { CronModule } from './modules/cron/cron.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { UploadFileModule } from './modules/upload-file/upload-file.module';
import { ValidatorsModule } from '@validators/validators.module';
import { TransactionModule } from './transaction/transaction.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development.local', '.env.development'],
      load: [appConfig, databaseConfig, authConfig],
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../', '/public'),
      serveRoot: '/',
      exclude: ['/api/*', '/auth/*'],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        ({
          ttl: config.get<number>('THROTTLE_TTL'),
          limit: config.get<number>('THROTTLE_LIMIT'),
        } as ThrottlerModuleOptions),
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        ({
          redis: {
            host: config.get<string>('REDIS_HOST'),
            port: config.get<number>('REDIS_PORT'),
          },
        } as BullRootModuleOptions),
    }),
    LoggerModule,
    DatabaseModule,
    CronModule,
    AuthModule,
    UserModule,
    UploadFileModule,
    ValidatorsModule,
    // Module DEV -> Not Use
    TransactionModule,
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
