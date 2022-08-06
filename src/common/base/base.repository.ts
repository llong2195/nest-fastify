import { Injectable } from '@nestjs/common';
import { DataSource, EntityTarget } from 'typeorm';

import { Repository, BaseEntity } from 'typeorm';

@Injectable()
export class BaseRepository<T extends BaseEntity> extends Repository<T> {
  constructor(entity: EntityTarget<T>, dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
  }
  /**
   * Add a basic where clause to the query and return the first result.
   */

  async store(T): Promise<any | T | null> {
    this.manager.transaction((tran) => {
      return tran.save(T);
    });
  }
}
