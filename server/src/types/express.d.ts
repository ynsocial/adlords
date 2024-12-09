import { Request } from 'express';
import { IUser } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: Date;
      };
    }
  }
}
