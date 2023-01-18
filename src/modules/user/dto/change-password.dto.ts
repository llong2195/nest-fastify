import { IsNotEmpty, Length, Validate } from 'class-validator';
import { PasswordConfirmValidator } from '@validators/password-confirm.validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty()
    @IsNotEmpty()
    @Length(8, 24)
    password: string;

    @ApiProperty()
    @IsNotEmpty()
    @Length(8, 24)
    new_password: string;

    @ApiProperty()
    @IsNotEmpty()
    @Validate(PasswordConfirmValidator, ['new_password'])
    new_password_confirmation: string;
}
