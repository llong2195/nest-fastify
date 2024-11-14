import { applyDecorators, UseGuards } from '@nestjs/common';

import { Roles } from './role.decorators';
import { RoleEnum } from '../enums';
import { RolesGuard } from '../guard/role.guard';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

export const Authorize = (...roles: RoleEnum[]) => {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    UseGuards(RolesGuard),
    Roles(...roles),
  );
};
