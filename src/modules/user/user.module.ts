import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './controller/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserSubscriber } from './subscriber/user.subscriber';
import { UserRepository } from './user.repository';
import { AdminUserController } from './controller/admin.user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController, AdminUserController],
  providers: [UserService, UserSubscriber, UserRepository],
  exports: [UserService],
})
export class UserModule {}
