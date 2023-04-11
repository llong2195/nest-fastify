import { CommandFactory } from 'nest-commander';

import { LogLevel } from '@nestjs/common';

import { CommanderModule } from '@modules/commander/commander.module';

// import { AppModule } from './app.module';

async function bootstrap() {
    const logLevelsDefault: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
    await CommandFactory.run(CommanderModule, logLevelsDefault);
}

bootstrap();
