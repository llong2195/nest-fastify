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
        private readonly dataSource: DataSource,
    ) {}

    async validate(value: string, validationArguments: ValidationArguments) {
        const repository = validationArguments.constraints[0] as EntityTarget<any>;
        if (!value || !repository) {
            return false;
        }
        const repo = await this.dataSource.getRepository(repository);
        if (!repo) {
            return false;
        }
        const entity = await repo.findOne({
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
