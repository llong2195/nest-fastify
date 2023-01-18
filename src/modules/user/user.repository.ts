import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@base/base.repository';

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
    getInactiveUsers(): Promise<UserEntity[]> {
        return this.repository.createQueryBuilder().where('isActive = :active', { active: true }).getMany();
    }
}
