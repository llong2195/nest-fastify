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
import { BaseResponseDto, AuthUserDto } from '../../base/base.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { plainToClass } from 'class-transformer';
import { User } from '../user/entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterRequestDto } from './dto/register-request.dto';
import { AuthUser } from 'src/decorators/auth.user.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly userService: UserService) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(@Body() request: LoginRequestDto): Promise<BaseResponseDto<any>> {
    const data = await this.authService.login(request);
    return new BaseResponseDto<any>(plainToClass(User, data));
  }

  @UseGuards(JwtAuthGuard)
  @Get('/my-profile')
  async myProfile(@AuthUser() authUser: AuthUserDto): Promise<BaseResponseDto<User>> {
    const user = await this.userService.findById(authUser.id);
    return new BaseResponseDto<User>(plainToClass(User, user));
  }

  @HttpCode(HttpStatus.OK)
  @Post('/register')
  async register(@Body() registerRequestDto: RegisterRequestDto): Promise<BaseResponseDto<User>> {
    const user = await this.userService._store(registerRequestDto);

    return new BaseResponseDto<User>(plainToClass(User, user));
  }
}
