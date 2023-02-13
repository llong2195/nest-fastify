import { JWT_EXPIRES_IN, JWT_SECRET_KEY } from './config';

export const authConfig = (): Record<string, string> => ({
    jwtSecretKey: JWT_SECRET_KEY,
    jwtExpiresIn: JWT_EXPIRES_IN,
});
