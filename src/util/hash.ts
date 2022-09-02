import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT } from '../config';

export class Hash {
  static make(plainText): string {
    return bcrypt.hashSync(plainText, BCRYPT_SALT);
  }

  static compare(plainText, hash): boolean {
    return bcrypt.compareSync(plainText, hash);
  }
}
