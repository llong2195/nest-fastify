import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
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
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService, // private readonly nodemailerService: NodemailerService,
  ) {}
  async validateUser(email: string, password: string): Promise<User | undefined> {
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
}
