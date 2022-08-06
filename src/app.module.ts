import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DemoModule } from './modules/demo/demo.module';
import { DatabaseModule } from './common/database/database.module';
import appConfig from './common/config/app.config';
import authConfig from './common/config/auth.config';
import databaseConfig from './common/config/database.config';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],
    }),

    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),

    BullModule.forRoot({
      redis: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: Number(process.env['REDIS_PORT']) || 6379,
      },
    }),
    LoggerModule,
    DatabaseModule,
    DemoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
