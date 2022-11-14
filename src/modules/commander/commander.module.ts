import { Module } from '@nestjs/common';
import { UserCommander } from './user.commander';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [UserCommander],
})
export class CommanderModule {}
