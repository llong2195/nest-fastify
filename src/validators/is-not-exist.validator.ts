import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { DataSource, EntityTarget } from 'typeorm';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
@ValidatorConstraint({ name: 'IsNotExist', async: true })
export class IsNotExist implements ValidatorConstraintInterface {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async validate(value: string, validationArguments: ValidationArguments) {
    const repository = validationArguments.constraints[0] as EntityTarget<any>;
    const entity = await this.dataSource.getRepository(repository).findOne({
      where: {
        [validationArguments.property]: value,
      },
    });

    return !Boolean(entity);
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `${validationArguments.value} is taken, please try another`;
  }
}
