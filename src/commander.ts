import { LogLevel } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';

import { CommanderModule } from '@modules/commander/commander.module';

async function bootstrap() {
    const logLevelsDefault: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
    await CommandFactory.run(CommanderModule, logLevelsDefault);
}

bootstrap();
