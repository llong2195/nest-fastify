import { Module } from '@nestjs/common';
import { UserCommander } from './user.commander';
import { DatabaseModule } from '@src/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { appConfig, authConfig, databaseConfig } from '@config/index';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '.env.development.local', '.env.development'],
            load: [appConfig, databaseConfig, authConfig],
        }),
        DatabaseModule,
    ],
    controllers: [],
    providers: [UserCommander],
})
export class CommanderModule {}
