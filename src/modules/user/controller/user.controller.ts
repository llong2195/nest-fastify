import { AuthUser } from 'src/decorators/auth.user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

import { AuthUserDto, BaseResponseDto } from '@base/base.dto';
import {
    Body, ClassSerializerInterceptor, Controller, Post, UseGuards, UseInterceptors
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ChangePasswordDto } from '../dto/change-password.dto';
import { UserEntity } from '../entities/user.entity';
import { UserService } from '../user.service';

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
    ): Promise<BaseResponseDto<UserEntity>> {
        const user = await this.userService.changePassword(authUser.id, password);
        return new BaseResponseDto<UserEntity>(user);
    }
}
