import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT } from '../config';

export class Hash {
  static make(plainText) {
    return bcrypt.hashSync(plainText, BCRYPT_SALT);
  }

  static compare(plainText, hash) {
    return bcrypt.compareSync(plainText, hash);
  }
}
