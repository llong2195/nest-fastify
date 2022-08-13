import { IsNotEmpty, Length, Validate } from 'class-validator';
import { PasswordConfirmValidator } from '@validators/password-confirm.validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @Length(8, 24)
  password: string;

  @IsNotEmpty()
  @Validate(PasswordConfirmValidator, ['password'])
  password_confirmation: string;
}
