import { join } from 'path';

import { appConfig, authConfig, databaseConfig } from '@config/index';
import { HttpModule } from '@nestjs/axios';
import { BullModule, BullRootModuleOptions } from '@nestjs/bull';
import { ClassSerializerInterceptor, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { QueueModule } from '@src/modules/queue/queue.module';
import { ValidatorsModule } from '@validators/validators.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AllExceptionFilter } from './filter/exception.filter';
import { I18nModule } from './i18n/i18n.module';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommanderModule } from './modules/commander/commander.module';
import { CronModule } from './modules/cron/cron.module';
import { FileModule } from './modules/file/file.module';
import { HealthModule } from './modules/health/health.module';
import { NodemailerModule } from './modules/nodemailer/nodemailer.module';
import { SettingModule } from './modules/setting/setting.module';
import { UserModule } from './modules/user/user.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env'],
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

        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                timeout: configService.get('HTTP_TIMEOUT'),
                maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
            }),
            inject: [ConfigService],
        }),

        LoggerModule,
        I18nModule,
        DatabaseModule,
        HealthModule,
        ValidatorsModule,
        SettingModule,
        CronModule,
        AuthModule,
        UserModule,
        FileModule,
        NodemailerModule,
        QueueModule,
        CommanderModule,
        // IORedisModule.registerAsync({
        //     imports: [ConfigModule],
        //     useFactory: async (configService: ConfigService): Promise<IRedisModuleOptions> => {
        //         return {
        //             connectionOptions: {
        //                 host: configService.get('REDIS_HOST'),
        //                 port: configService.get('REDIS_PORT'),
        //                 password: configService.get('REDIS_PASS'),
        //             },
        //             onClientReady: (client: Redis) => {
        //                 client.on('connect', () => {
        //                     LoggerService.log(
        //                         `Connected to redis on ${client.options.host}:${client.options.port}`,
        //                         IORedisModule.name,
        //                     );
        //                 });
        //             },
        //         };
        //     },
        //     inject: [ConfigService],
        // }),
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_FILTER,
            useClass: AllExceptionFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ClassSerializerInterceptor,
        },
        AppService,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        // consumer.apply(RawBodyMiddleware).forRoutes({
        //     path: 'webhook/stripe',
        //     method: RequestMethod.POST,
        // });
    }
}
