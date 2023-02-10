import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginRequestDto } from './dto/login-request.dto';
import { AuthUserDto } from '@base/base.dto';
import { ErrorMessageCode } from '@src/constants/errort-message-code';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly configService: ConfigService, // private readonly nodemailerService: NodemailerService,
    ) {}
    /**
     * It takes an email and password, finds the user in the database, compares the password, and
     * returns the user if the password is correct
     * @param {string} email - string, password: string
     * @param {string} password - The password that the user entered in the login form.
     * @returns The user object is being returned.
     */
    async validateUser(email: string, password: string): Promise<UserEntity | undefined> {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException(ErrorMessageCode.LOGIN_FAIL);
        }
        const compareResult = await bcrypt.compare(password, user.password);
        if (!compareResult) {
            throw new UnauthorizedException(ErrorMessageCode.LOGIN_FAIL);
        }
        return user;
    }

    /**
     * It takes a LoginRequestDto, finds a user by email, compares the password, and returns a token
     * @param {LoginRequestDto} request - LoginRequestDto: This is the request object that will be sent
     * to the server.
     * @returns user and token
     */
    async login(request: LoginRequestDto): Promise<any> {
        const user = await this.userService.findByEmail(request.email);
        if (!user) {
            throw new UnauthorizedException(ErrorMessageCode.LOGIN_FAIL);
        }
        const compareResult = await bcrypt.compare(request.password, user.password);
        if (!compareResult) {
            throw new UnauthorizedException(ErrorMessageCode.LOGIN_FAIL);
        }
        if (!user.isActive) {
            throw new UnauthorizedException(ErrorMessageCode.DISABLED_ACCOUNT);
        }
        if (user.deleted) {
            throw new HttpException(ErrorMessageCode.DELETED_ACCOUNT, HttpStatus.BAD_REQUEST);
        }
        const payload: AuthUserDto = {
            email: user.email,
            id: user.id,
            role: user.role,
        };
        const token = await this.createToken(payload);
        return { ...user, token };
    }

    /**
     * It takes a payload, which is an object of type AuthUserDto, and returns a token
     * @param {AuthUserDto} payload - The data to be encrypted.
     * @returns A JWT token
     */
    async createToken(payload: AuthUserDto) {
        return await this.jwtService.signAsync(payload);
    }

    /**
     * It takes a token, verifies it, and then returns the user that is associated with the token
     * @param {string} token - The token that was sent in the request.
     * @returns The user object
     */
    public async getUserFromAuthenticationToken(token: string): Promise<UserEntity> {
        const payload: any = this.jwtService.verify(token, {
            secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        });
        if (payload.id) {
            return this.userService.findById(payload.id);
        }
    }
}
