import { HttpStatus } from '@nestjs/common';
import { ValidatorOptions } from 'class-validator';

export const ValidationConfig: ValidatorOptions | Record<string, any> = {
  whitelist: true,
  errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  forbidNonWhitelisted: true,
  disableErrorMessages: false,
  skipMissingProperties: false,
};
