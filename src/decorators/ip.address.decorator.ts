import { FastifyRequest } from 'fastify';

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 *  A decorator that can be used to get the ip address from the request header, you need to configure
    nginx to get the ip.
 */
export const IpAddress = createParamDecorator((_data: string, ctx: ExecutionContext) => {
    const req: FastifyRequest = ctx.switchToHttp().getRequest();
    const rawIp: string | undefined =
        req.headers['x-forwarded-for'][0] || req.connection.remoteAddress || req.socket.remoteAddress;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ipAddress = rawIp ? rawIp!.split(',')[0] : '';
    return ipAddress;
});
