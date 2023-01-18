import { Injectable } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { BaseService } from '@base/base.service';
import { SettingEntity } from './entities/setting.entity';
import { SettingRepository } from './setting.repository';
import { LoggerService } from '@src/logger/custom.logger';

@Injectable()
export class SettingService extends BaseService<SettingEntity, SettingRepository> {
    constructor(repository: SettingRepository, logger: LoggerService) {
        super(repository, logger);
    }
}
