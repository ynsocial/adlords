import { Request } from 'express';
import { IUser } from './interfaces';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      startTime?: number;
      requestId?: string;
      body: any;
      query: any;
      params: any;
      path: string;
      method: string;
      url: string;
      ip: string;
      headers: any;
      files?: any;
      file?: any;
      rateLimit?: {
        remaining: number;
        limit: number;
        reset: Date;
      };
    }
  }
}
