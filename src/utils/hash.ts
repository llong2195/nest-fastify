import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT } from '../config';

export class Hash {
    /**
     *
     * @param plainText
     * @returns
     */
    static make(plainText: string | Buffer, salt = BCRYPT_SALT): string {
        return bcrypt.hashSync(plainText, salt);
    }

    static compare(plainText: string | Buffer, hash: string): boolean {
        return bcrypt.compareSync(plainText, hash);
    }
}
