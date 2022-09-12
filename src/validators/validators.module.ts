import { Module } from '@nestjs/common';
import { UserModule } from '../modules/user/user.module';
import { PasswordConfirmValidator } from './password-confirm.validator';
import { UniqueEmailValidator } from './unique-email.validator';
import { IsExist } from './is-exist.validator';
import { IsNotExist } from '@validators/is-not-exist.validator';

@Module({
  imports: [UserModule],
  providers: [PasswordConfirmValidator, UniqueEmailValidator, IsExist, IsNotExist],
  exports: [PasswordConfirmValidator, UniqueEmailValidator, IsExist, IsNotExist],
})
export class ValidatorsModule {}
