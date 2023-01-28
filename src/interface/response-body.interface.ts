import { HttpStatus } from '@nestjs/common';

export interface IResponseBody {
    statusCode: HttpStatus | number;
    message: string | object;
    errorCode: number | string | object;
}
