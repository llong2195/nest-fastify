import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { join } from 'node:path';

import { AppController } from './app.controller';
import { ComponentModule } from './components/component.module';
import { DatabaseModule } from './database/database.module';
import { EnvEnum } from './enums';
import { AllExceptionFilter } from './filter/exception.filter';
import { ThrottlerBehindProxyGuard } from './guard/throttler-behind-proxy.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ResponseTransformInterceptor } from './interceptors/response.transform.interceptor';
import { IORedisModule, IRedisModuleOptions } from './libs';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { CronModule } from './modules/cron/cron.module';
import { FileModule } from './modules/file/file.module';
import { NodemailerModule } from './modules/nodemailer/nodemailer.module';
import { QrCodeModule } from './modules/qr-code/qr-code.module';
import { QueueModule } from './modules/queue/queue.module';
import { SettingModule } from './modules/setting/setting.module';
import { UserModule } from './modules/user/user.module';
import { isEnv } from './utils';
import { ValidatorsModule } from './validators/validators.module';

const providers = [] as Provider[];
const modules = [] as DynamicModule[];

if (isEnv(EnvEnum.Production)) {
  providers.push({
    provide: APP_GUARD,
    useClass: ThrottlerBehindProxyGuard,
  });
} else {
  providers.push({
    provide: APP_INTERCEPTOR,
    useClass: LoggingInterceptor,
  });
}
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../', '/public'),
      serveRoot: '/',
      exclude: ['/api/*', '/auth/*'],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        ({
          throttlers: [
            {
              ttl: config.get<number>('THROTTLE_TTL'),
              limit: config.get<number>('THROTTLE_LIMIT'),
            },
          ],
          ignoreUserAgents: [
            // Don't throttle request that have 'googlebot' defined in them.
            // Example user agent: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)
            /googlebot/gi,

            // Don't throttle request that have 'bingbot' defined in them.
            // Example user agent: Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)
            new RegExp('bingbot', 'gi'),
          ],
        }) as ThrottlerModuleOptions,
    }),

    LoggerModule,

    IORedisModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): IRedisModuleOptions => {
        return {
          connectionOptions: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
            username: configService.get<string>('REDIS_USERNAME'),
            password: configService.get<string>('REDIS_PASSWORD'),
          },
        };
      },
      inject: [ConfigService],
    }),

    ComponentModule,
    DatabaseModule,
    ValidatorsModule,
    QueueModule,
    CronModule,
    QrCodeModule,
    SettingModule,
    AuthModule,
    UserModule,
    FileModule,
    NodemailerModule,

    ...modules,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    ...providers,
  ],
})
export class AppModule {}
