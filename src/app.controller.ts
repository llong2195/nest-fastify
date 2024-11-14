import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';

import { ErrorMessageCode } from './constants';
import { ValidateError } from './exceptions/errors';
import { LoggerService } from './logger/custom.logger';

@ApiTags('/')
@Controller()
export class AppController {
  constructor(private logger: LoggerService) {}

  @Get()
  getHello() {
    return 'hello';
  }

  @Get('/profile')
  profile(@Req() req: FastifyRequest) {
    this.logger.verbose('verbose main');
    this.logger.debug('verbose 1', 'verbose 1');
    this.logger.log('log', 'verbose 1');
    this.logger.warn('warn');
    this.logger.error('error');
    return req.headers;
  }

  @Get('exceptions')
  TestException(): any {
    throw new ValidateError(ErrorMessageCode.INVALID, 400);
  }

  @Get('healthz')
  selfCheck(): unknown {
    return 'OK';
  }
}
