import { ApiProperty } from '@nestjs/swagger';
import { UniqueEmailValidator } from '@validators/unique-email.validator';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, Length, Validate } from 'class-validator';
import { PasswordConfirmValidator } from '@validators/password-confirm.validator';

export class RegisterRequestDto {
  @ApiProperty({ example: 'email@gmail.com' })
  @IsNotEmpty({ message: 'email is not empty' })
  @IsEmail(undefined, { message: 'email invalid' })
  @Validate(UniqueEmailValidator, { message: 'email invalid' })
  email: string;

  @ApiProperty({ example: 'F name' })
  @IsNotEmpty({ message: 'first name is not empty' })
  firstName: string;

  @ApiProperty({ example: 'L name' })
  @IsNotEmpty({ message: 'last name is not empty' })
  lastName: string;

  @ApiProperty({ example: '1', required: false })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  avatarId: number;

  @ApiProperty({ example: 'password' })
  @IsNotEmpty({ message: 'password is not empty' })
  @Length(8, 24, { message: 'password invalid' })
  password: string;

  @ApiProperty({ example: 'password' })
  @IsNotEmpty({ message: 'password confirmation is not empty' })
  @Validate(PasswordConfirmValidator, ['password'], {
    message: 'password confirmation invalid',
  })
  passwordConfirmation: string;
}
