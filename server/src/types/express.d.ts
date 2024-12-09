import { Request } from 'express';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      startTime?: number;
      requestId?: string;
      body: Record<string, any>;
      query: Record<string, any>;
      params: Record<string, any>;
      path: string;
      method: string;
      url: string;
      ip: string;
      headers: Record<string, string | string[] | undefined>;
      files?: Express.Multer.File[];
      file?: Express.Multer.File;
      rateLimit?: {
        remaining: number;
        limit: number;
        reset: Date;
        current: number;
      };
    }
  }
}
