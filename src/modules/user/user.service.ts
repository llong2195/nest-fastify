import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { BaseService } from '../../base/base.service';
import { UserRepository } from './user.repository';
import { User } from './entities/user.entity';
import { LoggerService } from '../../logger/custom.logger';
import { EntityId } from 'typeorm/repository/EntityId';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Hash } from 'src/util/hash';

@Injectable()
export class UserService extends BaseService<User, UserRepository> {
  constructor(repository: UserRepository, logger: LoggerService) {
    super(repository, logger);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email: email } });
  }

  findById(id: number): Promise<User> {
    return this._findById(id);
  }

  getInactiveUsers(): Promise<User[]> {
    return this.repository.getInactiveUsers();
  }

  async changePassword(userId: number, changePass: ChangePasswordDto): Promise<User> {
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
