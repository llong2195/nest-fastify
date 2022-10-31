import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  constructor(@InjectRepository(UserEntity) private repository: Repository<UserEntity>) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
  // constructor(repository: Repository<T>) {
  //   super(repository.target, repository.manager, repository.queryRunner);
  // }
  /**
   * Add a basic where clause to the query and return the first result.
   */
  getInactiveUsers(): Promise<UserEntity[]> {
    return this.repository.createQueryBuilder().where('isActive = :active', { active: true }).getMany();
  }
  getA(): Promise<UserEntity[]> {
    return this.repository.find();
  }
}
