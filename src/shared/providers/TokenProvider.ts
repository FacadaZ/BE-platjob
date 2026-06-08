import jwt from 'jsonwebtoken';
import { env } from '@config/environment.js';

export interface TokenPayload {
  sub: string;
  email: string;
  role: 'CLIENT' | 'TECHNICIAN' | 'ADMIN';
}

export class TokenProvider {
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  }
}
