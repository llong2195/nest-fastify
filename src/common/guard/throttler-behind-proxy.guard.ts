import { FastifyRequest } from 'fastify';

import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

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
