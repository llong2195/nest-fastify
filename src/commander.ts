import { CommandFactory } from 'nest-commander';
// import { CommanderModule } from '@src/modules/commander/commander.module';
import { LogLevel } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const logLevelsDefault: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
    await CommandFactory.run(AppModule, logLevelsDefault);
}

bootstrap();
