import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;

  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const parsePort = (value: string): number => {
  const port = Number(value);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
};

export const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: parsePort(getEnv('PORT', '5000')),
  mongoUri: getEnv('MONGO_URI'),
  jwtAccessSecret: getEnv('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
  jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
  jwtAccessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d')
};