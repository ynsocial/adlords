import { Request as ExpressRequest } from 'express';
import { IUser } from './index';

declare global {
  namespace Express {
    interface Request extends ExpressRequest {
      user?: IUser;
      startTime?: number;
      requestId?: string;
    }
  }
}
