import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@entities/user.entity';

import { IsExist } from './is-exist.validator';
import { IsNotExist } from './is-not-exist.validator';
import { PasswordConfirmValidator } from './password-confirm.validator';
import { UniqueEmailValidator } from './unique-email.validator';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    providers: [PasswordConfirmValidator, UniqueEmailValidator, IsExist, IsNotExist],
    exports: [PasswordConfirmValidator, UniqueEmailValidator, IsExist, IsNotExist],
})
export class ValidatorsModule {}
