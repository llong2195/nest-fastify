import { Request } from 'express';

import { ValidateError } from '@exceptions/errors/index';
import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';
import { ErrorMessageCode } from './constants';
import { LoggerService } from './logger/custom.logger';

@ApiTags('/')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private logger: LoggerService) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('/profile')
    async profile(@Req() req: Request): Promise<any> {
        this.logger.verbose('verbose main');
        this.logger.debug('verbose 1', 'verbose 1');
        this.logger.log('log', 'verbose 1');
        this.logger.warn('warn');
        this.logger.error('error');
        return req.headers;
    }

    @Get('exceptions')
    TestException(): any {
        throw new ValidateError(ErrorMessageCode.INVALID, 400, 9000);
    }

    @Get('healthz')
    selfCheck(): unknown {
        return 'OK';
    }
}
