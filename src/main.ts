import { INestApplication, LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ResponseTransformInterceptor } from './interceptors/response.transform.interceptor';
import { ValidationConfig } from '@src/configs/validation.config';
import { ValidatorsModule } from '@validators/validators.module';
// import { runInCluster } from './utils/runInCluster';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { LoggerService } from '@src/logger/custom.logger';
import { isEnv } from './utils/util';
import { Env } from './enums/app.enum';
import { useRequestLogging } from './middlewares/request-logging.middlewares';
import { NestExpressApplication } from '@nestjs/platform-express';

declare const module: any;

async function bootstrap() {
    let logLevelsDefault: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];

    if (isEnv(Env.Production) || isEnv(Env.Staging)) {
        logLevelsDefault = ['error', 'warn'];
    }
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: logLevelsDefault,
    });
    // Config
    const configService = app.get(ConfigService);
    const port = configService.get<number>('port');
    const LISTEN_ON = configService.get<string>('LISTEN_ON') || '0.0.0.0';

    // Middleware
    app.use(helmet());

    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));

    useContainer(app.select(ValidatorsModule), { fallbackOnErrors: true });

    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalPipes(new ValidationPipe(ValidationConfig));
    app.setGlobalPrefix(configService.get<string>('apiPrefix'));
    if (isEnv(Env.Dev)) {
        app.enableCors({
            origin: '*',
        });
        await ConfigDocument(app);
        useRequestLogging(app, 0);
    } else {
        app.enableCors({
            origin: '*',
        });
    }

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
    //
    const config = new DocumentBuilder()
        .setTitle('API')
        .setDescription('API docs')
        .setVersion('1.0')
        .addTag('Document For API')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'accessToken')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    LoggerService.log(`==========================================================`);
    LoggerService.log(`Swagger Init`, ConfigDocument.name);
    LoggerService.log(`==========================================================`);
}

bootstrap();

// runInCluster(bootstrap);
