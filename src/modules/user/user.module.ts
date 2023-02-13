import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FileModule } from '../file/file.module';
import { AdminUserController } from './controller/admin.user.controller';
import { UserController } from './controller/user.controller';
import { UserEntity } from './entities/user.entity';
import { UserSubscriber } from './subscriber/user.subscriber';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity]), FileModule],
    controllers: [UserController, AdminUserController],
    providers: [UserService, UserSubscriber, UserRepository],
    exports: [UserService],
})
export class UserModule {}
