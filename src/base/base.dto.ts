export class BaseResponseDto<T> {
  message: string;
  data: T;
  constructor(data: T | null = null, message = 'success') {
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
  message: string;
  items: T[];
  total: number;

  constructor(items: T[] = [], total = 0, message = 'success') {
    return { message, items, total };
  }
}
