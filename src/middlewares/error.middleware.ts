import { NextFunction, Request, Response, ErrorRequestHandler } from 'express';
import { env } from '../config/env';

type ErrorWithStatus = Error & {
  statusCode?: number;
  status?: number;
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`) as ErrorWithStatus;
  error.statusCode = 404;
  next(error);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const error = err as ErrorWithStatus;
  const statusCode = error.statusCode ?? error.status ?? 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(env.nodeEnv !== 'production' ? { stack: error.stack } : {})
  });
};
