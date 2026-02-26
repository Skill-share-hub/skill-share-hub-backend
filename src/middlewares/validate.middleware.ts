import { NextFunction, Request, RequestHandler, Response } from 'express';

export const validate = <T>(validator: (body: unknown) => T): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = validator(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};