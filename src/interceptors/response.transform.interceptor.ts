import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseResponseDto } from '@base/base.dto';
import { LoggerService } from '@src/logger/custom.logger';
import { I18nService } from '@src/i18n/i18n.service';
import { isEnv } from '@src/utils/util';
import { Env } from '@src/enums';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, BaseResponseDto<T>> {
    private i18nService: I18nService;

    intercept(context: ExecutionContext, next: CallHandler): Observable<BaseResponseDto<T>> {
        const request = context?.switchToHttp()?.getRequest();
        const response = context?.switchToHttp()?.getResponse();
        const now = Date.now();
        this.i18nService = new I18nService(request);
        return next.handle().pipe(
            tap(() => {
                LoggerService.log(
                    `{${request?.route?.path}, ${request?.method}} - ${response?.statusCode} : ${Date.now() - now} ms`,
                    context?.getClass().name,
                );
            }),
            map(response => {
                if (response?.message) {
                    return { ...response, message: this.i18nService.t(response?.message) };
                }
                return response;
            }),
        );
    }
}
