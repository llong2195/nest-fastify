import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { SettingEntity } from '@entities/setting.entity';

@Injectable()
export class SettingRepository extends Repository<SettingEntity> {
  constructor(
    private readonly dataSource: DataSource,
    manager?: EntityManager,
  ) {
    let sManager: EntityManager;
    let sQueryRunner: QueryRunner;
    if (manager && manager != undefined && manager != null) {
      sQueryRunner = manager.queryRunner;
      sManager = manager;
    } else {
      sManager = dataSource?.createEntityManager();
      sQueryRunner = dataSource?.createQueryRunner();
    }
    super(SettingEntity, sManager, sQueryRunner);
  }
}
