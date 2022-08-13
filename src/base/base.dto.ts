export class BaseResponseDto<T> {
  message: string;
  data: T;
  constructor(message = 'success', data: T | null = null) {
    this.message = message;
    if (data instanceof String) {
      this.data = { ...data };
    } else {
      this.data = data;
    }
  }
}

export class AuthUserDto {
  email: string;
  id: number;
}

export class PaginationResponse<T> {
  items: T[];
  total: number;

  constructor(items: T[] = [], total = 0) {
    return { items, total };
  }
}

import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number;

  @IsOptional()
  keyword: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id: number;

  @IsOptional()
  filter: { [key: string]: any };

  @IsOptional()
  sort: { by: string; direction: 'ASC' | 'DESC' };
}
