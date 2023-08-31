import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from '@src/database/database.module';
import { UserCommander } from './user.commander';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env'],
        }),
        DatabaseModule,
    ],
    controllers: [],
    providers: [UserCommander],
})
export class CommanderModule {}
