import { PORT, BCRYPT_SALT, API_PREFIX, SERVER_URL } from './config';
export default (): Record<string, any> => ({
    port: PORT || 3000,
    bcryptSalt: BCRYPT_SALT || 10,
    minPasswordLength: 8,
    maxPasswordLength: 24,
    apiPrefix: API_PREFIX,
    serverUrl: SERVER_URL,
});
