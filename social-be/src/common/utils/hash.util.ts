import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

export class HashUtil {
  private static readonly SALT_ROUNDS = 10;

  static async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.SALT_ROUNDS);
  }

  static async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }

  /**
   * Refresh tokens are high-entropy bearer credentials. A deterministic digest
   * lets us look up and revoke a session without retaining the credential
   * itself in the database.
   */
  static hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
