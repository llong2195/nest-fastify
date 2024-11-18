import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseResponseDto } from '../base/base.dto';
import { DEFAULT_LOCALE } from '../configs';
import { I18nService } from '../components/i18n.service';

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, BaseResponseDto<T>>
{
  constructor(private i18n: I18nService) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<BaseResponseDto<T>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const lang =
      request?.headers['accept-language']?.split(';')[0]?.split(',')[0] ||
      DEFAULT_LOCALE;
    return next.handle().pipe(
      map((response: BaseResponseDto<T>) => {
        if (response.message) {
          return {
            ...response,
            message: this.i18n.lang(response.message, lang),
          };
        }
        return response;
      }),
    );
  }
}
