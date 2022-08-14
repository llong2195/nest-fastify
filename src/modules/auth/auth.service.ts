import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginRequestDto } from './dto/login-request.dto';
import authConfig from '@config/auth.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, // private readonly nodemailerService: NodemailerService,
  ) {}
  async validateUser(
    email: string,
    password: string,
  ): Promise<User | undefined> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Username is incorrect');
    }
    const compareResult = await bcrypt.compare(password, user.password);
    if (!compareResult) {
      throw new UnauthorizedException('Password is incorrect');
    }
    return user;
  }

  async login(request: LoginRequestDto): Promise<any> {
    const user = await this.userService.findByEmail(request.email);
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.deleted) {
      throw new HttpException('Tài Khoản Đã Bị Xoá', HttpStatus.BAD_REQUEST);
    }
    const payload = {
      email: user.email,
      id: user.id,
      // role: user.role,
    };
    const token = await this.jwtService.signAsync(payload);

    return { ...user, token };
  }

  // async sendOtp(forgotPassword: forgotPasswordDto): Promise<any> {
  //   const data = await this.userService.createOtp(forgotPassword);
  //   // console.log(data)
  //   return this.nodemailerService.send(data.email, {
  //     subject: 'Mã OTP',
  //     html: `<h1>Mã OTP của bạn là : <i>${data.OTP}</i></h1> `,
  //   });
  // }

  // async verifyAndResetPassword(resetPasswordDto: ResetPasswordDto) {
  //   const user = await this.userService.verifyOtp(
  //     resetPasswordDto.email,
  //     resetPasswordDto.otp,
  //   );
  //   // console.log(user)
  //   if (user) {
  //     const updateUser = await this.userService.changePassword(user.id, {
  //       password: resetPasswordDto.password,
  //       password_confirmation: resetPasswordDto.passwordConfirmation,
  //     });
  //     await this.userService.removeOtp(user.id);
  //     return updateUser;
  //   } else {
  //     throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
  //   }
  // }
}
