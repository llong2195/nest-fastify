import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/features/arguments-host.interface';
import { Request, Response } from 'express';
import { LoggerService } from 'src/logger/custom.logger';
import { QueryFailedError } from 'typeorm';
import { I18nService } from '@src/i18n/i18n.service';
import * as Sentry from '@sentry/node';
import { setExtras, captureException } from '@sentry/node';
import '@sentry/tracing';
import { SENTRY_DSN } from '@src/configs';
import { isDev, isEnv } from '../utils/util';
import { IResponseBody } from '@src/interface';
import { ErrorCode } from '../constants/error-code';
import { EnvEnum } from '@enums/app.enum';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
    constructor(private logger: LoggerService) {
        Sentry.init({
            dsn: SENTRY_DSN,
            normalizeDepth: 10,
            tracesSampleRate: 1.0,
        });
    }

    private static handleResponse(
        request: Request,
        response: Response,
        exception: HttpException | QueryFailedError | Error,
    ): void {
        const { body, headers, ip, method, originalUrl, params, query, user } = request;
        setExtras({
            authorization: headers.authorization,
            body,
            ip,
            method,
            params,
            query,
            url: headers.origin + originalUrl,
            user,
        });
        captureException(exception);
        const i18nService = new I18nService(request);
        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let errorCode = ErrorCode.UNKNOWN;
        let message = 'Internal server error';
        let responseBody: IResponseBody = {
            statusCode: statusCode,
            errorCode: errorCode,
            message: message,
        };
        if (exception instanceof HttpException) {
            // responseBody = exception.getResponse()
            // statusCode = HttpStatus.BAD_REQUEST;
            statusCode = exception.getStatus();
            errorCode = ErrorCode.UNKNOWN;
            message =
                typeof exception.getResponse() == 'string'
                    ? exception.getResponse()
                    : JSON.parse(JSON.stringify(exception.getResponse())).message;
            responseBody = {
                statusCode: statusCode,
                errorCode: errorCode,
                message: message,
            };
        } else if (exception instanceof QueryFailedError) {
            statusCode = HttpStatus.BAD_REQUEST;
            errorCode = ErrorCode.UNKNOWN;
            message = isDev() ? exception.message : 'Invalid data or query error';
            responseBody = {
                statusCode: statusCode,
                errorCode: errorCode,
                message: message,
            };
        } else if (exception instanceof Error) {
            statusCode = HttpStatus.BAD_REQUEST;
            errorCode = ErrorCode.UNKNOWN;
            message = exception.stack;
            responseBody = {
                statusCode: statusCode,
                errorCode: errorCode,
                message: message,
            };
        }

        if (Array.isArray(responseBody.message)) {
            responseBody.message = responseBody.message[0];
            // responseBody.message = responseBody.message;
        }
        // responseBody['timestamp'] = new Date();
        responseBody.message =
            typeof responseBody.message === 'string' ? i18nService.t(responseBody.message) : responseBody.message;
        response.status(statusCode).json(responseBody);
    }

    catch(exception: HttpException | Error, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse();
        const request: Request = ctx.getRequest();
        this.logger.error(exception.message, exception.stack, exception.name);
        // Handling error message and logging
        this.handleMessage(exception);

        // Response to client
        AllExceptionFilter.handleResponse(request, response, exception);
    }

    private handleMessage(exception: HttpException | QueryFailedError | Error): void {
        let message = 'Internal Server Error';

        if (exception instanceof HttpException) {
            message = JSON.stringify(exception.getResponse());
        } else if (exception instanceof QueryFailedError) {
            message = exception.stack.toString();
        } else if (exception instanceof Error) {
            message = exception.stack.toString();
            if (message.includes('no such file or directory')) {
                message = 'Not Found';
            }
        }
    }
}
