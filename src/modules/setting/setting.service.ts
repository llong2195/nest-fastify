import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseService } from '@/base/base.service';
import { SettingEntity } from '@/entities';
import { LoggerService } from '@/logger/custom.logger';

@Injectable()
export class SettingService extends BaseService<
  SettingEntity,
  Repository<SettingEntity>
> {
  constructor(
    @InjectRepository(SettingEntity) repository: Repository<SettingEntity>,
    logger: LoggerService,
  ) {
    super(repository, logger);
  }
}
