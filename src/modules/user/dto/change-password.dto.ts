import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length, Validate } from 'class-validator';

import { IsEqualField } from '@/validators/is-equal-field.validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @Length(8, 24)
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @Length(8, 24)
  newPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @Validate(IsEqualField, ['new_password'], {
    message: 'password confirmation is not equal new password',
  })
  newPasswordConfirmation: string;
}
