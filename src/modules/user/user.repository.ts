import { Repository } from 'typeorm';

import { PaginationResponse } from '@base/base.dto';
import { BaseRepository } from '@base/base.repository';
import { PAGE_SIZE } from '@config/index';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
    constructor(@InjectRepository(UserEntity) private repository: Repository<UserEntity>) {
        super(repository);
    }
    // constructor(repository: Repository<T>) {
    //   super(repository.target, repository.manager, repository.queryRunner);
    // }
    /**
     * Add a basic where clause to the query and return the first result.
     */
    getInactiveUsers(page: number, limit: number = PAGE_SIZE): Promise<PaginationResponse<UserEntity>> {
        const qb = this.repository.createQueryBuilder().where('is_active = :active', { active: true });
        // const repo = this.repository.manager.getRepository(UserEntity);
        // const qb2 = repo.createQueryBuilder().where('is_active = :active', { active: true });
        return this._iPaginate(qb, page, limit);
    }
}
