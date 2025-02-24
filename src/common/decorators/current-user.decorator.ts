import { FastifyRequest } from 'fastify';

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface FastifyRequestWithUser extends FastifyRequest {
  user?: any; // Define the type of user here
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequestWithUser>();
    return request?.user as unknown;
  },
);
