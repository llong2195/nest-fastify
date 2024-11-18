import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SettingEntity } from '@/entities';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';

@Module({
  imports: [TypeOrmModule.forFeature([SettingEntity])],
  controllers: [SettingController],
  providers: [SettingService],
})
export class SettingModule {}
