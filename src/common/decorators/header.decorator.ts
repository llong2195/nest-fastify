import { FastifyRequest } from 'fastify';

import { DEFAULT_LOCALE } from '@/configs/config';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

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
