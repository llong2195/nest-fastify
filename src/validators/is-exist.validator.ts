import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { DataSource, EntityTarget } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';
import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'IsExist', async: true })
export class IsExist implements ValidatorConstraintInterface {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async validate(value: string, validationArguments: ValidationArguments) {
    const repository = validationArguments.constraints[0] as EntityTarget<any>;
    const pathToProperty = validationArguments.constraints[1];
    const repo = await this.dataSource.getRepository(repository);
    if (!value || !repository || !pathToProperty || !repo) {
      return false;
    }

    const entity: unknown = await repo.findOne({
      where: {
        [pathToProperty ? pathToProperty : validationArguments.property]: pathToProperty
          ? value?.[pathToProperty] || value
          : value,
      },
    });
    if (typeof entity === 'undefined') {
      return false;
    }
    return Boolean(entity);
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `${validationArguments.value}" is not Exist.`;
  }
}
