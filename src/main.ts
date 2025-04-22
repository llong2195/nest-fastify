import { useContainer } from 'class-validator';
import fastify from 'fastify';

import helmet from '@fastify/helmet';
import FastifyMultipart from '@fastify/multipart';
import {
  ForbiddenException,
  INestApplication,
  LogLevel,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { EnvEnum } from './common/enums';
import { LoggerService } from './common/logger/custom.logger';
import { I18nService } from './common/shared/i18n.service';
import { ValidatorsModule } from './common/validators/validators.module';
import { ValidationConfig } from './configs';
import { isEnv, isProd } from './utils';

async function bootstrap() {
  let logLevelsDefault: LogLevel[] = [
    'log',
    'error',
    'warn',
    'debug',
    'verbose',
  ];

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
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(instance as any),
    {
      logger: logLevelsDefault,
    },
  );
  // ------------- Config ---------------
  const configService = app.get(ConfigService);
  const port: number = configService.get<number>('PORT') || 4000;
  const LISTEN_ON: string = configService.get<string>('LISTEN_ON') || '0.0.0.0';
  const DOMAIN_WHITELIST: string[] = (
    configService.get<string>('DOMAIN_WHITELIST') || '*'
  ).split(',');
  const API_PREFIX = configService.get<string>('API_PREFIX') || 'api';
  // -------------------------------------------

  // -------------- Middleware --------------
  await app.register(FastifyMultipart as any);
  // -------------------------------------------

  // -------------- Global filter/pipes --------------
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(new ValidationPipe(ValidationConfig));
  app.enableVersioning({ type: VersioningType.URI });
  // -------------------------------------------

  // -------------- Setup Cors --------------
  if (isProd()) {
    app.enableCors({
      origin: (origin, callback) => {
        if (
          DOMAIN_WHITELIST.indexOf('*') !== -1 ||
          (origin && DOMAIN_WHITELIST.indexOf(origin) !== -1)
        ) {
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
    await app.register(helmet as any);
  } else {
    app.enableCors({
      origin: '*',
      optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    });
    // -----------Setup Swagger-------------
    ConfigDocument(app, `${API_PREFIX}/docs`);
    // -------------------------------------------
  }

  // -------------------------------------------

  // -----------------Validator-----------------
  useContainer(app.select(ValidatorsModule), { fallbackOnErrors: true });
  // -------------------------------------------

  // -----------I18nService init-------------
  I18nService.init();
  // -------------------------------------------

  // -----------Setup Redis Adapter-------------
  // await initAdapters(app);
  // -------------------------------------------

  await app.listen(port, LISTEN_ON, (error, addr) => {
    LoggerService.log(
      `==========================================================`,
    );
    LoggerService.log(`Server is running on port : ${port}`, 'Server');
    LoggerService.log(`Application is running on : ${addr}`, 'Application');
    if (!isProd()) {
      LoggerService.log(`Swagger: ${addr}/${API_PREFIX}/docs`);
    }
    LoggerService.log(
      `==========================================================`,
    );
  });
}

function ConfigDocument(app: INestApplication, path: string) {
  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addTag('Document For API')
    .addBearerAuth({
      type: 'http',
      in: 'header',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(path, app, document);
  LoggerService.log(
    `==========================================================`,
  );
  LoggerService.log(`Swagger Init: /${path}`, ConfigDocument.name);
  LoggerService.log(
    `==========================================================`,
  );
}

void bootstrap();

// runInCluster(bootstrap);
