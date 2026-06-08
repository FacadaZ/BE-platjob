import bcrypt from 'bcrypt';

export class HashProvider {
  private static readonly SALT_ROUNDS = 10;

  static async generateHash(payload: string): Promise<string> {
    return bcrypt.hash(payload, this.SALT_ROUNDS);
  }

  static async compareHash(payload: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(payload, hashed);
  }
}
