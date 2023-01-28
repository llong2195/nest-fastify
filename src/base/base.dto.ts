import { ApiProperty } from '@nestjs/swagger';
import { MessageCode } from '@src/constants/message-code';
import { ConvertToBoolean, ConvertToNumber } from '@src/utils';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsBoolean } from 'class-validator';

export class BaseResponseDto<T> {
    message: string;
    body: T | T[] | unknown | any;

    constructor(body: T | T[] | null = null, message = MessageCode.SUCCESS) {
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
    body: T | T[] | unknown | any;
    meta: {
        pagination: {
            currentPage: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };

    constructor(
        body: T[] | T | null = [],
        meta = {
            pagination: {
                currentPage: 0,
                limit: 0,
                total: 0,
                totalPages: 0,
            },
        },
        message = MessageCode.SUCCESS,
    ) {
        this.message = message;
        this.body = body;
        this.meta = meta;
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
    @ConvertToNumber()
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
    @ConvertToNumber()
    @IsOptional()
    @Min(1)
    @Max(1000)
    limit: number;

    @ApiProperty({
        default: false,
        required: false,
        description: 'deleted',
    })
    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    @ConvertToBoolean()
    deleted: boolean;
}
