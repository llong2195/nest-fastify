import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { authConfig } from '@src/configs/auth.config';

export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: authConfig().jwtSecretKey,
        });
    }

    /**
     * It takes a payload, and returns a payload
     * @param {any} payload - The payload to validate.
     * @returns The payload is being returned.
     */
    async validate(payload: any) {
        return payload;
    }
}
