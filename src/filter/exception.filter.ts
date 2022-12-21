import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/features/arguments-host.interface';
import { Request, Response } from 'express';
import { LoggerService } from 'src/logger/custom.logger';
import { QueryFailedError } from 'typeorm';
import { I18nService } from '@src/i18n/i18n.service';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}

  private static handleResponse(
    request: Request,
    response: Response,
    exception: HttpException | QueryFailedError | Error,
  ): void {
    let responseBody: any = { message: 'Internal server error' };
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) {
      // responseBody = exception.getResponse()
      // statusCode = HttpStatus.BAD_REQUEST;
      statusCode = exception.getStatus();
      responseBody = {
        statusCode: statusCode,
        message:
          typeof exception.getResponse() == 'string'
            ? exception.getResponse()
            : JSON.parse(JSON.stringify(exception.getResponse())).message,
      };
    } else if (exception instanceof QueryFailedError) {
      console.log('exception.driverError');
      console.log(exception.driverError);
      statusCode = HttpStatus.BAD_REQUEST;
      responseBody = {
        statusCode: statusCode,
        message: exception.message,
        // message: 'Invalid data or query error',
      };
    } else if (exception instanceof Error) {
      responseBody = {
        statusCode: statusCode,
        message: exception.stack,
      };
    }

    if (Array.isArray(responseBody.message)) {
      responseBody.message = responseBody.message[0];
      // responseBody.message = responseBody.message;
    }
    // responseBody['timestamp'] = new Date();
    responseBody.message = new I18nService(request).t(responseBody.message);
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
