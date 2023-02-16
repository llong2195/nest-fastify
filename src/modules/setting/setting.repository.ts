import { DataSource, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';

import { SettingEntity } from './entities/setting.entity';

@Injectable()
export class SettingRepository extends Repository<SettingEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(SettingEntity, dataSource.manager);
    }
}
