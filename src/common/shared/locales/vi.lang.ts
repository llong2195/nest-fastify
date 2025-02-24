import { objectToFlatMap } from '@/utils/util';

const viLangs = {
  SUCCESS: 'Thành công.',
  UNKNOWN: 'Không xác định.',
  INVALID: 'Không hợp lệ.',
  SYSTEM_GENERAL_ERROR: 'Lỗi chung hệ thống.',
  DATABASE_ERROR: 'Lỗi cơ sở dữ liệu.',
  INVALID_HEADERS: 'Headers không hợp lệ.',
  SYNTAX_ERROR: 'Lỗi cú pháp.',
  NOT_FOUND: 'Không tìm thấy.',
  DATABASE_CONNECTION_ERROR: 'Lỗi kết nối cơ sở dữ liệu.',
  INSERT_ERROR: 'Lỗi thêm dữ liệu.',
  UPDATE_ERROR: 'Lỗi cập nhập dữ liệu);',
  DELETE_ERROR: 'Lỗi xóa dữ liệu.',
  RECORD_NOT_FOUND: 'Không tìm thấy bản ghi.',
  PERMISSION_DENIED: 'Không có quyền truy cập.',
  AUTH_LOGIN_FAIL: 'Đăng nhập thất bại.',
  AUTH_INVALID_TOKEN: 'Token không hợp lệ.',
  AUTH_MISSING_JWT: 'Thiếu jwt.',
  AUTH_DELETED_ACCOUNT: 'Tài khoản đã bị xóa.',
  AUTH_DISABLED_ACCOUNT: 'Tài khoản vô hiệu hóa.',
  AUTH_EXPIRED_TOKEN: 'Token hết hạn.',
  AUTH_INVALID_EMAIL_ADDRESS: 'Email không hợp lệ.',
  AUTH_INVALID_PASSWORD: 'Password không đúng.',
  NEW_PASSWORD_SAME_AS_CURRENT_PASSWORD:
    'Mật khẩu mới giống với mật khẩu hiện tại.',
  NON_ACTIVATED_ACCOUNT: 'Tài khoản chưa kích hoạt.',
  OTP_LIMIT_REACHED: 'Đạt đến giới hạn otp.',
  USER_NOT_FOUND: 'Không tìm thấy người dùng.',
  TOKEN_NOT_FOUND: 'Không tìm thấy token.',
};

const lang = objectToFlatMap(viLangs);

export default lang;
