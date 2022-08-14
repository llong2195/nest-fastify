import { JWT_SECRET_KEY, JWT_EXPIRES_IN } from './config';
export default (): Record<string, string> => ({
  jwtSecretKey: process.env.JWT_SECRET_KEY,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
});
