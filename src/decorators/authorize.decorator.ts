import { applyDecorators, UseGuards } from '@nestjs/common';

import { RoleEnum } from '@enums/role.enum';
import { RolesGuard } from '@guard/role.guard';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { Roles } from './role.decorators';

export const Authorize = (...roles: RoleEnum[]) => {
  return applyDecorators(UseGuards(JwtAuthGuard), UseGuards(RolesGuard), Roles(...roles));
};
