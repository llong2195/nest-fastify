import { Repository } from 'typeorm';

import { BaseRepository } from '@base/base.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { SettingEntity } from './entities/setting.entity';

@Injectable()
export class SettingRepository extends BaseRepository<SettingEntity> {
    constructor(@InjectRepository(SettingEntity) private repository: Repository<SettingEntity>) {
        super(repository);
    }
}
