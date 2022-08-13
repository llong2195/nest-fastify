import { Module } from '@nestjs/common';
import { UserModule } from '../modules/user/user.module';
import { PasswordConfirmValidator } from './password-confirm.validator';
import { UniqueEmailValidator } from './unique-email.validator';

@Module({
  imports: [UserModule],
  providers: [PasswordConfirmValidator, UniqueEmailValidator],
  exports: [PasswordConfirmValidator, UniqueEmailValidator],
})
export class ValidatorsModule {}
