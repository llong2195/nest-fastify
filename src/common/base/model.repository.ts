import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import { Repository, DataSource, EntityTarget } from 'typeorm';

@Injectable()
export class ModelRepository<
  T extends { type: T; name: string },
> extends Repository<T> {
  constructor(private entity: T, private dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
  }
  /**
   * Add a basic where clause to the query and return the first result.
   */
}
