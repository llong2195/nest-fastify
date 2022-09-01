import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, Length, Validate } from 'class-validator';
import { PasswordConfirmValidator } from '@validators/password-confirm.validator';
import { UniqueEmailValidator } from '@validators/unique-email.validator';

export class AdminCreateUserDto {
  @IsNotEmpty({ message: 'email is not empty' })
  @IsEmail(undefined, { message: 'email invalid' })
  @Validate(UniqueEmailValidator, { message: 'email invalid' })
  email: string;

  @IsNotEmpty({ message: 'first name is not empty' })
  firstName: string;

  @IsNotEmpty({ message: 'last name is not empty' })
  lastName: string;

  @IsOptional()
  avatarId: number;

  @IsNotEmpty({ message: 'password is not empty' })
  @Length(8, 24, { message: 'password invalid' })
  password: string;

  @IsNotEmpty({ message: 'password confirmation is not empty' })
  @Validate(PasswordConfirmValidator, ['password'], {
    message: 'password confirmation invalid',
  })
  passwordConfirmation: string;

  @IsNotEmpty({ message: 'isActive is not empty' })
  @IsBoolean({ message: 'isActive invalid' })
  isActive: boolean;
}
