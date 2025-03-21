import { objectToFlatMap } from '@/utils/util';

const enLangs = {
  SUCCESS: 'success.',
  UNKNOWN: 'unknown.',
  INVALID: 'invalid.',
  SYSTEM_GENERAL_ERROR: 'system general error.',
  DATABASE_ERROR: 'database error.',
  INVALID_HEADERS: 'invalid headers.',
  SYNTAX_ERROR: 'syntax error.',
  NOT_FOUND: 'not found.',
  DATABASE_CONNECTION_ERROR: 'database connection error.',
  INSERT_ERROR: 'insert error.',
  UPDATE_ERROR: 'update error.',
  DELETE_ERROR: 'delete error.',
  RECORD_NOT_FOUND: 'record not found.',
  PERMISSION_DENIED: 'permission denied.',
  AUTH_LOGIN_FAIL: 'login fail.',
  AUTH_INVALID_TOKEN: 'invalid token.',
  AUTH_MISSING_JWT: 'missing jwt.',
  AUTH_DELETED_ACCOUNT: 'deleted account.',
  AUTH_DISABLED_ACCOUNT: 'disabled account.',
  AUTH_EXPIRED_TOKEN: 'expired token.',
  AUTH_INVALID_EMAIL_ADDRESS: 'invalid email address.',
  AUTH_INVALID_PASSWORD: 'invalid password.',
  NEW_PASSWORD_SAME_AS_CURRENT_PASSWORD:
    'new password same as current password.',
  NON_ACTIVATED_ACCOUNT: 'non activated account.',
  OTP_LIMIT_REACHED: 'otp limit reached.',
  USER_NOT_FOUND: 'user not found.',
  TOKEN_NOT_FOUND: 'token not found.',
};

const lang = objectToFlatMap(enLangs);

export default lang;
