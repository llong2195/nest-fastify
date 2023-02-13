import { ExtractJwt, Strategy } from 'passport-jwt';

import { PassportStrategy } from '@nestjs/passport';
import { authConfig } from '@src/configs/auth.config';

export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
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
