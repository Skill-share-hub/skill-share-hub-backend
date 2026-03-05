import { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate = (schema: z.ZodType): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue,i) => {
          return String(issue.path[i]) + " ---> " + issue.message
        })
        .join(' | ');
      throw new ApiError(400, message);
    }

    req.body = result.data;
    next();
  };
};