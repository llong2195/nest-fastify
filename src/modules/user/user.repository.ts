import { DataSource, Repository } from 'typeorm';

import { PAGE_SIZE } from '@config/index';
import { Injectable } from '@nestjs/common';

import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(UserEntity, dataSource.manager);
    }

    /**
     * Get all inactive users, with a default page size of 10.
     * @param {number} page - The page number to return.
     * @param {number} limit - number = PAGE_SIZE
     * @returns An array of UserEntity objects.
     */
    getInactiveUsers(page: number, limit: number = PAGE_SIZE): Promise<UserEntity[]> {
        return this.createQueryBuilder().where('is_active = :active', { active: true }).getMany();
    }
}
