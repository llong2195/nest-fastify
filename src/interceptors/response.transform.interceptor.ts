import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseResponseDto } from '@base/base.dto';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, BaseResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<BaseResponseDto<T>> {
    return next.handle().pipe(map((response) => response));
  }
}
