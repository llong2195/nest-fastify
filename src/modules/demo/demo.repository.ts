import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Demo } from './entities/demo.entity';
import { BaseRepository } from 'src/common/base/base.repository';

@Injectable()
export class DemoRepository extends BaseRepository<Demo> {
  constructor(private dataSource: DataSource) {
    super(Demo, dataSource);
  }

  /**
   * Add a basic where clause to the query and return the first result.
   */
  async findById(id: number): Promise<Demo> {
    return this.createQueryBuilder('').where('id = :id', { id: id }).getOne();
  }

  async sortCus(): Promise<Demo[]> {
    return this.find({ order: { createdAt: 'DESC' } });
  }
}
