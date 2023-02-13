import { API_PREFIX, BCRYPT_SALT, PORT, SERVER_URL } from './config';

export const appConfig = (): Record<string, any> => ({
    port: PORT || 3000,
    bcryptSalt: BCRYPT_SALT || 10,
    minPasswordLength: 8,
    maxPasswordLength: 24,
    apiPrefix: API_PREFIX,
    serverUrl: SERVER_URL,
});
