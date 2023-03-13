import { DataSource, EntityManager, Repository } from 'typeorm';

import { Injectable, Optional } from '@nestjs/common';

import { SettingEntity } from './entities/setting.entity';

@Injectable()
export class SettingRepository extends Repository<SettingEntity> {
    constructor(private readonly dataSource: DataSource, @Optional() manager?: EntityManager) {
        let sManager = dataSource.createEntityManager();
        let sQueryRunner = dataSource.createQueryRunner();
        if (manager && manager != undefined && manager != null) {
            sManager = manager;
            sQueryRunner = manager.queryRunner;
        }
        super(SettingEntity, sManager, sQueryRunner);
    }
}
