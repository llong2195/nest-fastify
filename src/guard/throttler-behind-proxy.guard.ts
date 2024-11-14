import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FastifyRequest } from 'fastify';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected getTracker(request: FastifyRequest): Promise<string> {
    return new Promise<string>((resolve) => {
      const tracker =
        (request?.ips?.length ?? 0 > 0)
          ? (request?.ips?.[0] ?? '')
          : request?.ip;
      resolve(tracker);
    });
  }
}
