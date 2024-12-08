import { Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Not authorized to access this resource'));
    }

    next();
  };
};
