import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../base/base.repository';
import { User } from './entities/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource);
  }

  /**
   * Add a basic where clause to the query and return the first result.
   */
  getInactiveUsers(): Promise<User[]> {
    return this.createQueryBuilder().where('isActive = :active', { active: false }).getMany();
  }
}
