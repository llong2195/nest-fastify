import { JWT_SECRET_KEY, JWT_EXPIRES_IN } from './config';
export const authConfig = (): Record<string, string> => ({
    jwtSecretKey: JWT_SECRET_KEY,
    jwtExpiresIn: JWT_EXPIRES_IN,
});
