import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseResponseDto } from '@base/base.dto';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { MessageService } from '@src/i18n/message.service';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, BaseResponseDto<T>> {
    constructor(private i18n: MessageService) {}
    intercept(context: ExecutionContext, next: CallHandler): Observable<BaseResponseDto<T>> {
        const request = context.switchToHttp().getRequest<FastifyRequest>();
        return next.handle().pipe(
            map(response => {
                if (response?.message) {
                    return { ...response, message: this.i18n.lang(response?.message) };
                }
                return response;
            }),
        );
    }
}
