import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './controller/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserSubscriber } from './subscriber/user.subscriber';
import { UserRepository } from './user.repository';
import { AdminUserController } from './controller/admin.user.controller';
import { FileModule } from '../file/file.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), FileModule],
  controllers: [UserController, AdminUserController],
  providers: [UserService, UserSubscriber, UserRepository],
  exports: [UserService],
})
export class UserModule {}
