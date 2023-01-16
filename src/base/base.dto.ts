import { MessageCode } from '@src/constant/messageCode.enum';

export class BaseResponseDto<T> {
    message: string;
    body: T;

    constructor(body: T | null = null, message = MessageCode.SUCCESS) {
        this.message = message;
        if (body instanceof String) {
            this.body = { ...body };
        } else {
            this.body = body;
        }
    }
}

export class AuthUserDto {
    email: string;
    id: number;
    role?: string;
}

export class PaginationResponse<T> {
    message: string;
    body: T[];
    total: number;

    constructor(body: T[] = [], total = 0, message = MessageCode.SUCCESS) {
        return { message, body, total };
    }
}
