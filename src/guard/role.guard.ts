import { ROLES_KEY } from 'src/decorators/role.decorators';

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from '@src/enums/role.enum';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();

        return requiredRoles.some(role => user.role?.includes(role));
    }
}
