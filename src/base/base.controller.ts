import { BadRequestException, HttpException } from '@nestjs/common';
import { isString } from 'class-validator';
import { QueryFailedError } from 'typeorm';

import { ErrorCode } from '@constants/error-code';
import { ValidateError } from '@exceptions/errors';
import { BaseError } from '@exceptions/errors/base.error';
import { DatabaseError } from '@exceptions/errors/database.error';
import { MessageService } from '@src/i18n/message.service';

export class BaseController {
    private i18n: MessageService;

    constructor(i18n: MessageService) {
        this.i18n = i18n;
    }

    /***
     *
     * @param error
     * @param lang
     */
    protected throwErrorProcessForLang(error: unknown, lang: string): void {
        if (error instanceof BaseError) {
            throw new BadRequestException({
                message: this.i18n.lang(error.getMessage(), lang),
                errorCode: error.getErrorCode(),
            });
        } else if (error instanceof TypeError) {
            // console.error(error)
            throw new ValidateError(this.i18n.lang('UNKNOWN_ERROR', lang), ErrorCode.SYNTAX_ERROR);
        } else if (error instanceof QueryFailedError) {
            // console.error(error)
            throw new DatabaseError(this.i18n.lang('UNKNOWN_ERROR', lang), ErrorCode.UNKNOWN);
        } else if (error instanceof HttpException) {
            const response = error.getResponse() as Record<string, unknown>;
            if (isString(response)) {
                throw new BadRequestException({
                    message: this.i18n.lang((response.message as string) || 'Unknown error'),
                    errorCode: (response.errorCode as number) || ErrorCode.UNKNOWN,
                });
            }

            throw new BadRequestException({
                message: this.i18n.lang((response.message as string) || 'Unknown error'),
                errorCode: (response.errorCode as number) || ErrorCode.UNKNOWN,
            });
        }

        throw new DatabaseError(this.i18n.lang('UNKNOWN_ERROR', lang), ErrorCode.UNKNOWN);
    }
}
