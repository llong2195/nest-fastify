import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { DEFAULT_LOCALE } from '@/configs/config';

export const HeaderUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const headerData = {
      lang:
        request?.headers['accept-language']?.split(';')[0]?.split(',')[0] ||
        DEFAULT_LOCALE,
    };
    return headerData;
  },
);
