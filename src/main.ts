import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ResponseTransformInterceptor } from './interceptors/response.transform.interceptor';
import { ValidationConfig } from '@config/validation.config';
import { ValidatorsModule } from '@validators/validators.module';
import { runInCluster } from './utils/runInCluster';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { LoggerService } from '@src/logger/custom.logger';

declare const module: any;

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    app.use(helmet());

    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));

    app.enableCors({
        origin: '*',
    });

    useContainer(app.select(ValidatorsModule), { fallbackOnErrors: true });

    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalPipes(new ValidationPipe(ValidationConfig));
    app.setGlobalPrefix(configService.get<string>('apiPrefix'));

    await ConfigDocument(app);

    const port = configService.get<number>('port');
    await app.listen(port, () => {
        console.log(`SERVER IS RUNNING ON PORT : ${port}`);
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
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    LoggerService.log(ConfigDocument.name);
}

bootstrap();

// runInCluster(bootstrap);
