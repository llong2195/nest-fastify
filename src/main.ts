import helmet from '@fastify/helmet';
import FastifyMultipart from '@fastify/multipart';
import { ForbiddenException, INestApplication, LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import fastify from 'fastify';

import { ValidationConfig } from '@configs/validation.config';
import { EnvEnum } from '@enums/app.enum';
import { LoggerService } from '@logger/custom.logger';
import { isEnv } from '@utils/util';
import { ValidatorsModule } from '@validators/validators.module';
import { AppModule } from './app.module';
import { MessageService } from './i18n/message.service';

declare const module: any;

async function bootstrap() {
    let logLevelsDefault: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];

    if (isEnv(EnvEnum.Production) || isEnv(EnvEnum.Staging)) {
        const logLevel = process.env.LOG_LEVEL || 'error,debug,verbose';
        logLevelsDefault = logLevel.split(',') as LogLevel[];
    }
    const instance = fastify();
    // instance.addHook('onRequest', (request, reply, done) => {
    //     reply['setHeader'] = function (key, value) {
    //         return this.raw.setHeader(key, value);
    //     };
    //     reply['writeHead'] = function (key, value) {
    //         return this.raw.writeHead(key, value);
    //     };
    //     reply['end'] = function () {
    //         this.raw.end();
    //     };
    //     done();
    // });
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(instance), {
        logger: logLevelsDefault,
        snapshot: true,
    });
    // ------------- Config ---------------
    const configService = app.get(ConfigService);
    const port: number = configService.get<number>('PORT');
    const LISTEN_ON: string = configService.get<string>('LISTEN_ON') || '0.0.0.0';
    const DOMAIN_WHITELIST: string[] = (configService.get<string>('DOMAIN_WHITELIST') || '*').split(',');
    // -------------------------------------------

    // -------------- Middleware --------------
    app.register(FastifyMultipart);
    // -------------------------------------------

    // -------------- Global filter/pipes --------------
    app.useGlobalPipes(new ValidationPipe(ValidationConfig));
    app.setGlobalPrefix(configService.get<string>('API_PREFIX'));
    // -------------------------------------------

    // -------------- Setup Cors --------------
    if (isEnv(EnvEnum.Dev)) {
        app.enableCors({
            origin: '*',
            optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
        });
        // -----------Setup Swagger-------------
        await ConfigDocument(app);
        // -------------------------------------------
    } else {
        app.enableCors({
            origin: (origin, callback) => {
                if (DOMAIN_WHITELIST.indexOf('*') !== -1 || DOMAIN_WHITELIST.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(
                        new ForbiddenException(
                            `The CORS policy for this site does not allow access from the specified Origin.`,
                        ),
                        false,
                    );
                }
            },
            optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
        });
        await app.register(helmet);
    }
    // -------------------------------------------

    // -----------------Validator-----------------
    useContainer(app.select(ValidatorsModule), { fallbackOnErrors: true });
    // -------------------------------------------

    // -----------MessageService init-------------
    MessageService.init();
    // -------------------------------------------

    // -----------Setup Redis Adapter-------------
    // await initAdapters(app);
    // -------------------------------------------

    await app.listen(port, LISTEN_ON, async () => {
        LoggerService.log(`==========================================================`);
        LoggerService.log(`Server is running on port : ${port}`, 'Server');
        LoggerService.log(`Application is running on : ${await app.getUrl()}`, 'Application');
        LoggerService.log(`==========================================================`);
    });

    if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => app.close());
    }
}

async function ConfigDocument(app: INestApplication): Promise<void> {
    const config = new DocumentBuilder()
        .setTitle('API')
        .setDescription('API docs')
        .setVersion('1.0')
        .addTag('Document For API')
        .addBearerAuth({ type: 'http', in: 'header', scheme: 'bearer', bearerFormat: 'JWT' })
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    LoggerService.log(`==========================================================`);
    LoggerService.log(`Swagger Init: /docs`, ConfigDocument.name);
    LoggerService.log(`==========================================================`);
}

bootstrap();

// runInCluster(bootstrap);
