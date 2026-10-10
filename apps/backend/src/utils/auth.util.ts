import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';

export const generateToken = (payload: { userId: number; role: UserRole }) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as {
    userId: number;
    role: UserRole;
  };
};
