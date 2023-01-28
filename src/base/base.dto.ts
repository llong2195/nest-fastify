import { ApiProperty } from '@nestjs/swagger';
import { MessageCode } from '@src/constants/message-code';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsString } from 'class-validator';

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
    body: T | T[] | unknown | any;
    meta: {
        pagination: {
            currentPage: number;
            links: {
                next: string;
                prev: string;
            };
            limit: number;
            total: number;
            totalPages: number;
        };
    };
    [x: string]: any;

    constructor(
        body: T[] = [],
        meta = {
            pagination: {
                currentPage: 0,
                links: {
                    next: '',
                    prev: '',
                },
                limit: 0,
                total: 0,
                totalPages: 0,
            },
        },
        message = MessageCode.SUCCESS,
    ) {
        return { message, body, meta };
    }
}

export class iPaginationOption {
    @ApiProperty({
        default: 1,
        required: false,
        description: 'Page number',
    })
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    @Min(0)
    page: number;

    @ApiProperty({
        default: 10,
        required: false,
        description: 'Limit result number',
    })
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    @Min(1)
    @Max(1000)
    limit: number;

    @ApiProperty({
        default: false,
        required: false,
        description: 'deleted',
    })
    deleted: boolean;
}
