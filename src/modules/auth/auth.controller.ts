import { NextFunction, Request, Response } from 'express';

import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { ApiResponse } from '../../utils/ApiResponse';
import { loginUser, refreshTokens, registerUser } from './auth.service';
import { LoginInput, RegisterInput } from './auth.validation';

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

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload = req.body as LoginInput;
    const result = await loginUser(payload);
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

    res.status(200).json(
      new ApiResponse('User logged in successfully', {
        user: result.user
      })
    );
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token required');
    }

    const result = await refreshTokens(refreshToken);
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

    res.status(200).json(
      new ApiResponse('Token refreshed successfully', {
        user: result.user
      })
    );
  } catch (error) {
    next(error);
  }
};