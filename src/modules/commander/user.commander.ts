import { Injectable } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserEntity } from '@src/modules/user/entities/user.entity';
import bcrypt from 'bcrypt';
import { Role } from '@src/constant';

@Command({ name: 'seeding:user' })
export class UserCommander extends CommandRunner {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }
  async run(passedParams: string[], options?: Record<string, any>): Promise<void> {
    await this.dataSource.transaction(async (tran) => {
      await tran.getRepository(UserEntity).save({
        email: 'nduylong9501@gmail.com',
        password: bcrypt.hashSync('12345678', 10),
        isActive: true,
        role: Role.ADMIN,
      });
    });
  }
}
