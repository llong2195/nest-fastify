import { Controller, Get, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Request } from 'express';
import { ValidateError } from '@exceptions/errors/validate.error';
import { BaseError } from '@exceptions/errors/base.error';
import { DatabaseError } from '@exceptions/errors/database.error';
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
    @Post('exceptions')
    TestException(@Req() request: Request): string {
        try {
            throw new ValidateError('validate', 'errort', 400);
            // throwError<ValidateError>("database", "fdf", 400)
        } catch (e) {
            if (e instanceof ValidateError) {
                this.logger.error('ValidateError', e.stack);
            } else if (e instanceof DatabaseError) {
                this.logger.error('DatabaseError', e.stack);
            } else if (e instanceof BaseError) {
                this.logger.error('BaseError', e.stack);
            }
        }

        throw new ValidateError('validate', 'fdf', 400);
    }

    @Get('healthz')
    selfCheck(): unknown {
        return 'OK';
    }
}
