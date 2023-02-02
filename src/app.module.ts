import appConfig from '@src/configs/app.config';
import authConfig from '@src/configs/auth.config';
import databaseConfig from '@src/configs/database.config';
import { BullModule, BullRootModuleOptions } from '@nestjs/bull';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { AllExceptionFilter } from './filter/exception.filter';
import { CronModule } from './modules/cron/cron.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ValidatorsModule } from '@validators/validators.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { NodemailerModule } from './modules/nodemailer/nodemailer.module';
import { CommanderModule } from './modules/commander/commander.module';
import { QueueModule } from '@src/modules/queue/queue.module';
import { FileModule } from './modules/file/file.module';
import { I18nModule } from './i18n/i18n.module';
import { HttpModule } from '@nestjs/axios';
import { HealthModule } from './modules/health/health.module';
import { SettingModule } from './modules/setting/setting.module';
import { IORedisModule, IRedisModuleOptions } from '@libs/redis';
import { LoggerService } from './logger/custom.logger';
import { Redis } from 'ioredis';

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
        // RedisModule,
        CommanderModule,
        IORedisModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService): Promise<IRedisModuleOptions> => {
                return {
                    connectionOptions: {
                        host: configService.get('REDIS_HOST'),
                        port: configService.get('REDIS_PORT'),
                        password: configService.get('REDIS_PASS'),
                    },
                    onClientReady: (client: Redis) => {
                        client.on('error', err => {
                            LoggerService.error(err, IORedisModule.name);
                        });
                        client.on('connect', () => {
                            LoggerService.log(
                                `Connected to redis on ${client.options.host}:${client.options.port}`,
                                IORedisModule.name,
                            );
                        });
                    },
                };
            },
            inject: [ConfigService],
        }),
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
export class AppModule {}
