import { DataSource, Repository } from 'typeorm';

import { PAGE_SIZE } from '@config/index';
import { Injectable } from '@nestjs/common';

import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(UserEntity, dataSource.manager);
    }
    // constructor(repository: Repository<T>) {
    //   super(repository.target, repository.manager, repository.queryRunner);
    // }
    /**
     * Add a basic where clause to the query and return the first result.
     */
    getInactiveUsers(page: number, limit: number = PAGE_SIZE): Promise<UserEntity[]> {
        const qb = this.createQueryBuilder().where('is_active = :active', { active: true });
        return qb.getMany();
    }
}
