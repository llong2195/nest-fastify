import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
// import * as csurf from 'csurf';
// import helmet from 'helmet';
import { ResponseTransformInterceptor } from './interceptors/response.transform.interceptor';
import { ValidationConfig } from '@config/validation.config';
import { ValidatorsModule } from '@validators/validators.module';
import { runInCluster } from './util/runInCluster';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // app.use(helmet());
  // app.use(csurf());

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: '*',
  });

  useContainer(app.select(ValidatorsModule), { fallbackOnErrors: true });

  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalPipes(new ValidationPipe(ValidationConfig));
  app.setGlobalPrefix(configService.get<string>('apiPrefix'));

  const port = configService.get<number>('port');
  await app.listen(port, () => {
    console.log(`SERVER IS RUNNING ON PORT : ${port}`);
  });

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();

// runInCluster(bootstrap);
