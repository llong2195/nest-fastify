import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { LoggerService } from '@src/logger/custom.logger';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request: FastifyRequest = context?.switchToHttp()?.getRequest<FastifyRequest>();
        const response: FastifyReply = context?.switchToHttp()?.getResponse<FastifyReply>();
        const now = Date.now();
        return next.handle().pipe(
            tap(() => {
                LoggerService.log(
                    `{${request?.url}, ${request?.method}} - ${response?.statusCode} : ${Date.now() - now} ms`,
                );
            }),
        );
    }
}
