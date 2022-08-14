import { Injectable } from '@nestjs/common';
import { BaseService } from '../../base/base.service';
import { UserRepository } from './user.repository';
import { User } from './entities/user.entity';
import { LoggerService } from '../../logger/custom.logger';

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
}
