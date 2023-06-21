import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

import { Injectable } from '@nestjs/common';

import { UserService } from '@modules/user/user.service';

@ValidatorConstraint({ name: 'isEmailUnique', async: true })
@Injectable()
export class UniqueEmailValidator implements ValidatorConstraintInterface {
    constructor(private readonly userService: UserService) {}

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
        const result = await this.userService.findByEmail(value);
        return !result;
    }
}
