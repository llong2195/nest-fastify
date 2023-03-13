import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseResponseDto } from '@base/base.dto';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { I18nService } from '@src/i18n/i18n.service';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, BaseResponseDto<T>> {
    private i18nService: I18nService;

    intercept(context: ExecutionContext, next: CallHandler): Observable<BaseResponseDto<T>> {
        const request = context?.switchToHttp()?.getRequest();
        this.i18nService = new I18nService(request);
        return next.handle().pipe(
            map(response => {
                if (response?.message) {
                    return { ...response, message: this.i18nService.t(response?.message) };
                }
                return response;
            }),
        );
    }
}
