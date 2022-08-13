import { Injectable } from '@nestjs/common';
import { DataSource, EntityTarget } from 'typeorm';

import { Repository, BaseEntity } from 'typeorm';

@Injectable()
export class BaseRepository<T extends BaseEntity> extends Repository<T> {
  constructor(entity: EntityTarget<T>, dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
  }
}
