import { NextFunction, Request, Response } from 'express';

import { env } from '../../config/env';
import { ApiResponse } from '../../utils/ApiResponse';
import { registerUser } from './auth.service';
import { RegisterInput } from './auth.validation';

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload = req.body as RegisterInput;
    const result = await registerUser(payload);
    const isProduction = env.nodeEnv === 'production';

    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: ACCESS_COOKIE_MAX_AGE
    });

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: REFRESH_COOKIE_MAX_AGE
    });

    res.status(201).json(
      new ApiResponse('User registered successfully', {
        user: result.user
      })
    );
  } catch (error) {
    next(error);
  }
};