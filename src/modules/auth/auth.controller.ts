import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { HttpStatus } from '@nestjs/common';
import { BaseResponseDto, AuthUserDto } from '@base/base.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import { UserEntity } from '../user/entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterRequestDto } from './dto/register-request.dto';
import { AuthUser } from 'src/decorators/auth.user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('v1/auth')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly userService: UserService) {}

  // @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(@Body() request: LoginRequestDto): Promise<BaseResponseDto<any>> {
    const data = await this.authService.login(request);
    return new BaseResponseDto<any>(plainToInstance(UserEntity, data));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/my-profile')
  async myProfile(@AuthUser() authUser: AuthUserDto): Promise<BaseResponseDto<UserEntity>> {
    const user = await this.userService.findById(authUser.id);
    return new BaseResponseDto<UserEntity>(plainToClass(UserEntity, user));
  }

  @HttpCode(HttpStatus.OK)
  @Post('/register')
  async register(@Body() registerRequestDto: RegisterRequestDto): Promise<BaseResponseDto<UserEntity>> {
    const user = await this.userService._store(registerRequestDto);

    return new BaseResponseDto<UserEntity>(plainToClass(UserEntity, user));
  }
}
