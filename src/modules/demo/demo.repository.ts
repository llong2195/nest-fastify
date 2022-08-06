import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Demo } from './entities/demo.entity';

@Injectable()
export class DemoRepository extends Repository<Demo> {
  constructor(private dataSource: DataSource) {
    super(Demo, dataSource.createEntityManager());
  }

  /**
   * Add a basic where clause to the query and return the first result.
   */
  async findById(id: number): Promise<Demo> {
    return this.createQueryBuilder('').where('id = :id', { id: id }).getOne();
  }
}
