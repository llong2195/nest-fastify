import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseResponseDto } from '@base/base.dto';
import { LoggerService } from '@src/logger/custom.logger';
import { I18nService } from '@src/i18n/i18n.service';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, BaseResponseDto<T>> {
  private i18nService: I18nService;

  intercept(context: ExecutionContext, next: CallHandler): Observable<BaseResponseDto<T>> {
    this.i18nService = new I18nService(context?.switchToHttp()?.getRequest());
    const request = context.switchToHttp().getRequest();
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        LoggerService.log(
          `[${context?.getClass().name}] : ${request?.route?.path} : ${request.method} : ${new Date(
            now,
          ).toISOString()} ........ : ${Date.now() - now} ms`,
        );
      }),
      map((response) => {
        // console.log(new I18nService(context?.switchToHttp()?.getRequest()).t(response.message));
        if (response.message) {
          return { ...response, message: this.i18nService.t(response?.message) };
        }
        return response;
      }),
    );
  }
}
