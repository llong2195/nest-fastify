import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginRequestDto } from './dto/login-request.dto';
import { ErrorCode } from '@src/constant/errorCode.enum';
import { AuthUserDto } from '@base/base.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly configService: ConfigService, // private readonly nodemailerService: NodemailerService,
    ) {}
    async validateUser(email: string, password: string): Promise<UserEntity | undefined> {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException(ErrorCode.LOGIN_FAIL);
        }
        const compareResult = await bcrypt.compare(password, user.password);
        if (!compareResult) {
            throw new UnauthorizedException(ErrorCode.LOGIN_FAIL);
        }
        return user;
    }

    async login(request: LoginRequestDto): Promise<any> {
        const user = await this.userService.findByEmail(request.email);
        if (!user) {
            throw new UnauthorizedException(ErrorCode.LOGIN_FAIL);
        }
        const compareResult = await bcrypt.compare(request.password, user.password);
        if (!compareResult) {
            throw new UnauthorizedException(ErrorCode.LOGIN_FAIL);
        }
        if (!user.isActive) {
            throw new UnauthorizedException(ErrorCode.DISABLED_ACCOUNT);
        }
        if (user.deleted) {
            throw new HttpException(ErrorCode.DELETED_ACCOUNT, HttpStatus.BAD_REQUEST);
        }
        const payload: AuthUserDto = {
            email: user.email,
            id: user.id,
            // role: user.role,
        };
        const token = await this.createToken(payload);

        return { ...user, token };
    }

    async createToken(payload: AuthUserDto) {
        return await this.jwtService.signAsync(payload);
    }

    public async getUserFromAuthenticationToken(token: string): Promise<UserEntity> {
        const payload: any = this.jwtService.verify(token, {
            secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        });
        if (payload.userId) {
            return this.userService.findById(payload.userId);
        }
    }
}
