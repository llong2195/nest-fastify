import { compareSync, hashSync } from 'bcryptjs';

import { BCRYPT_SALT } from '@/configs';

export class Hash {
  /**
   * It takes a plain text string or buffer and returns a hashed string
   * @param {string} plainText - The plain text password that you want to hash.
   * @param salt - The salt to use when hashing the password.
   * @returns A string
   */
  static make(plainText: string, salt = BCRYPT_SALT): string {
    return hashSync(plainText, salt);
  }

  /**
   * It takes a plain text string or buffer and a hash, and returns true if the plain text matches the
   * hash
   * @param {string} plainText - The plain text password that you want to hash.
   * @param {string} hash - The hash to compare against.
   * @returns A boolean value.
   */
  static compare(plainText: string, hash: string): boolean {
    return compareSync(plainText, hash);
  }
}
