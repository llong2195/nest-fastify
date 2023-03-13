import { DataSource } from 'typeorm';
import { EntityId } from 'typeorm/repository/EntityId';

import { iPaginationOption, PaginationResponse } from '@base/base.dto';
import { BaseService } from '@base/base.service';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { LoggerService } from '@src/logger/custom.logger';
import { Hash } from '@src/utils/hash.util';

import { ChangePasswordDto } from './dto/change-password.dto';
import { UserEntity } from './entities/user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService extends BaseService<UserEntity, UserRepository> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        repository: UserRepository,
        logger: LoggerService,
    ) {
        super(repository, logger);
    }

    findByEmail(email: string): Promise<UserEntity | null> {
        return this.repository.findOne({ where: { email: email } });
    }

    findById(id: EntityId): Promise<UserEntity> {
        return this._findById(id);
    }

    async getInactiveUsers(filter: iPaginationOption): Promise<PaginationResponse<UserEntity>> {
        // const qb = this.repository.createQueryBuilder().where('is_active = :active', { active: true });
        // return this._iPaginate(qb, filter.page, filter.limit);
        // const repo = this.repository.manager.getRepository(UserEntity);
        // const qb2 = repo.createQueryBuilder().where('is_active = :active', { active: true });
        // return this._iPaginate(qb2, filter.page, filter.limit);
        const { page, limit, deleted } = filter;
        const result = await this.repository.getInactiveUsers(deleted, page, limit);
        const total = await this.repository.countInactiveUsers(deleted);
        return this.pagination<UserEntity>(result, total, page, limit);
    }

    async changePassword(userId: EntityId, changePass: ChangePasswordDto): Promise<UserEntity> {
        const user = await this._findById(userId);
        if (!user) {
            throw new UnauthorizedException('Username is incorrect');
        }
        const compareResult = Hash.compare(changePass.password, user.password);
        if (!compareResult) {
            throw new HttpException('Password is incorrect', HttpStatus.BAD_REQUEST);
        }
        user.password = changePass.new_password;
        await user.save();
        return user;
    }
}
