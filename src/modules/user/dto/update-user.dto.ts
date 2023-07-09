import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, Length, Validate } from 'class-validator';

import { PasswordConfirmValidator } from '@validators/password-confirm.validator';

export class UpdateUserDto {
    @ApiProperty()
    @IsOptional()
    firstName: string;

    @ApiProperty()
    @IsOptional()
    lastName: string;

    @ApiProperty()
    @IsOptional()
    @IsNotEmpty()
    @Length(8, 24)
    password: string;

    @ApiProperty()
    @IsOptional()
    @IsNotEmpty()
    @Validate(PasswordConfirmValidator, ['password'])
    password_confirmation: string;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    isActive: boolean;
}
