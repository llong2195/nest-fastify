import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { BaseService } from '@base/base.service';
import { UserRepository } from './user.repository';
import { UserEntity } from './entities/user.entity';
import { LoggerService } from '@src/logger/custom.logger';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Hash } from '@src/utils/hash.util';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EntityId } from 'typeorm/repository/EntityId';
import { FileRepository } from '../file/file.repository';
import { PaginationResponse, iPaginationOption } from '@base/base.dto';

@Injectable()
export class UserService extends BaseService<UserEntity, UserRepository> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        repository: UserRepository,
        logger: LoggerService,
        private readonly upLoadRepo: FileRepository,
    ) {
        super(repository, logger);
    }

    findByEmail(email: string): Promise<UserEntity | null> {
        return this.repository.findOne({ where: { email: email } });
    }

    findById(id: EntityId): Promise<UserEntity> {
        return this._findById(id);
    }

    getInactiveUsers(filter: iPaginationOption): Promise<PaginationResponse<UserEntity>> {
        return this.repository.getInactiveUsers(filter.page, filter.limit);
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
        user.password = Hash.make(changePass.new_password);
        await user.save();
        return user;
    }
}
