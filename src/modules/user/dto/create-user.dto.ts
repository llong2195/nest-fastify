import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, Length, Validate } from 'class-validator';
import { PasswordConfirmValidator } from '@validators/password-confirm.validator';
import { UniqueEmailValidator } from '@validators/unique-email.validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'test1@example.com' })
    @IsNotEmpty({ message: 'email is not empty' })
    @IsEmail(undefined, { message: 'email invalid' })
    @Validate(UniqueEmailValidator, { message: 'email invalid' })
    email: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'first name is not empty' })
    firstName: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'last name is not empty' })
    lastName: string;

    @ApiProperty()
    @IsOptional()
    avatarId: number;

    @ApiProperty()
    @IsNotEmpty({ message: 'password is not empty' })
    @Length(8, 24, { message: 'password invalid' })
    password: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'password confirmation is not empty' })
    @Validate(PasswordConfirmValidator, ['password'], {
        message: 'password confirmation invalid',
    })
    passwordConfirmation: string;

    @ApiProperty()
    @IsOptional()
    @IsBoolean({ message: 'isActive invalid' })
    isActive: boolean;
}
