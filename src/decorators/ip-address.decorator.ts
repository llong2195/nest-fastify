import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { getClientIp } from 'request-ip';

/**
 *  A decorator that can be used to get the ip address from the request header, you need to configure
    nginx to get the ip.
 */
export const IpAddress = createParamDecorator(
  (_data: string, ctx: ExecutionContext) => {
    const req: FastifyRequest = ctx.switchToHttp().getRequest();
    // const rawIp: string | undefined =
    //     req.header('x-forwarded-for') || req.connection.remoteAddress || req.socket.remoteAddress;
    // const ipAddress = rawIp ? rawIp?.split(',')[0] : '';
    const ipAddress = getClientIp(req);
    return ipAddress;
  },
);
