import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ErrorMessageCode } from '@/constants';
import { LoggerService } from '@/logger/custom.logger';

@Injectable()
export class RefreshAuthGuard extends AuthGuard('refresh') {
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    // You can throw an exception based on either "info" or "err" arguments

    if (err || !user || info) {
      LoggerService.error(err, user, info, context.switchToHttp().getRequest().ip, status);
      throw new UnauthorizedException(ErrorMessageCode.AUTH_INVALID_TOKEN);
    }
    return super.handleRequest(err, user, info, context, status);
  }
}
