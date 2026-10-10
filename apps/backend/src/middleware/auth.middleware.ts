import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.util';
import { AppError } from '../utils/AppError';
import { UserRole } from '@prisma/client';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'Unauthorized');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    throw new AppError(401, 'Invalid or expired token');
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'Forbidden');
    }
    next();
  };
};
