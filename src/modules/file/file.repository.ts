import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { FileEntity } from '@entities/file.entity';

@Injectable()
export class FileRepository extends Repository<FileEntity> {
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
    super(FileEntity, sManager, sQueryRunner);
  }

  /**
   * Add a basic where clause to the query and return the first result.
   */

  /**
   * It returns a promise that resolves to an array of all the documents in the collection
   * @returns The find() method returns a promise.
   */
  async findAll() {
    return this.find();
  }
}
