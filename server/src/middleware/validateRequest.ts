import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import { Schema } from 'zod';

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      next(new ValidationError(error.errors[0].message));
    }
  };
};
