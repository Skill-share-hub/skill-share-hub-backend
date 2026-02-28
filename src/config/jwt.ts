import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from './env';
import { UserRole } from '../modules/users/user.types';

interface JwtPayload {
  userId: string;
  role: UserRole;
}


const signToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: SignOptions['expiresIn']
): string => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const generateAccessToken = (payload: JwtPayload): string => {
  return signToken(payload, env.jwtAccessSecret, env.jwtAccessExpiresIn as SignOptions['expiresIn']);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return signToken(payload, env.jwtRefreshSecret, env.jwtRefreshExpiresIn as SignOptions['expiresIn']);
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
};