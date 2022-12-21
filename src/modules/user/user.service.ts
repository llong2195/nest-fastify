import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { BaseService } from '@base/base.service';
import { UserRepository } from './user.repository';
import { UserEntity } from './entities/user.entity';
import { LoggerService } from '@src/logger/custom.logger';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Hash } from 'src/util/hash';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EntityId } from 'typeorm/repository/EntityId';
import { FileRepository } from '../file/file.repository';

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

  getInactiveUsers(): Promise<UserEntity[]> {
    return this.repository.getInactiveUsers();
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

  async testTran(): Promise<any[]> {
    console.log('test=-tran');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const userRepo = queryRunner.manager.withRepository(this.repository);
    const uploadRepo = queryRunner.manager.withRepository(this.upLoadRepo);
    try {
      await queryRunner.commitTransaction();
      return await userRepo.getA();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async findaa(): Promise<UserEntity[]> {
    return this.repository.getA();
  }
}
