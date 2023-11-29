import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { DataSource } from 'typeorm';

import { UserEntity } from '@entities/user.entity';

@ValidatorConstraint({ name: 'isEmailUnique', async: true })
@Injectable()
export class UniqueEmailValidator implements ValidatorConstraintInterface {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `${validationArguments.value} is taken, please try another`;
  }

  /**
   * The function returns a boolean value that is the result of a promise that resolves to a boolean
   * value
   * @param {any} value - the value of the field that is being validated
   * @param {ValidationArguments} [validationArguments] - ValidationArguments
   * @returns A boolean value.
   */
  async validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> {
    validationArguments;
    const result = await this.dataSource.getRepository(UserEntity).findOneBy({ email: value });
    return !result;
  }
}
