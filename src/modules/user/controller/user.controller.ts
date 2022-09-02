import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from '../user.service';
import { AuthUserDto, BaseResponseDto } from '../../../base/base.dto';
import { User } from '../entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/decorators/auth.user.decorator';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@ApiTags('/v1/user')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/change-password')
  async changePassword(
    @AuthUser() authUser: AuthUserDto,
    @Body() password: ChangePasswordDto,
  ): Promise<BaseResponseDto<User>> {
    const user = await this.userService.changePassword(authUser.id, password);
    return new BaseResponseDto<User>(user);
  }
}
