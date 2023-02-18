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
    getInactiveUsers(deleted: boolean, page: number, limit: number = PAGE_SIZE): Promise<UserEntity[]> {
        return this.createQueryBuilder()
            .where('is_active = :active', { active: true })
            .andWhere('deleted =:deleted', { deleted: deleted })
            .getMany();
    }

    /**
     * This function returns a promise that resolves to the number of users that are active and not
     * deleted.
     * @param {boolean} deleted - boolean
     * @returns The number of users that are active and not deleted.
     */
    countInactiveUsers(deleted: boolean): Promise<number> {
        return this.createQueryBuilder()
            .where('is_active = :active', { active: true })
            .andWhere('deleted =:deleted', { deleted: deleted })
            .getCount();
    }
}
