import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@base/base.repository';
import { UserEntity } from './entities/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(private dataSource: DataSource) {
    super(UserEntity, dataSource);
  }

  /**
   * Add a basic where clause to the query and return the first result.
   */
  getInactiveUsers(): Promise<UserEntity[]> {
    return this.createQueryBuilder().where('isActive = :active', { active: false }).getMany();
  }
}
