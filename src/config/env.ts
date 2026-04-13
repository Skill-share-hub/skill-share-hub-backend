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
  jwtAccessSecret: getEnv('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET'),
  jwtAccessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  clientUrl: getEnv("CLIENT_URL"),
  googleClientId: getEnv("GOOGLE_CLIENT_ID"),
  redisUrl: getEnv("REDIS_URL"),
  
  emailUser: getEnv("MAIL_USER"), 
  redisUsername:getEnv("REDIS_USERNAME"),
  redisPassword:getEnv("REDIS_PASSWORD"),
  redisHost:getEnv("REDIS_HOST"),
  redisPort:getEnv("REDIS_PORT"),
  awsRegion : getEnv("AWS_REGION"),
  awsBucket : getEnv("AWS_BUCKET"),
  awsSecretKey : getEnv("AWS_SECRET_KEY"),
  awsAccessKey : getEnv("AWS_ACCESS_KEY"),
  razorpayKeyId : getEnv("RAZORPAY_KEY_ID"),
  razorpayKeySecret : getEnv("RAZORPAY_KEY_SECRET"),
  brevoApiKey: getEnv("BREVO_API_KEY"),

  openRouteApiKey : getEnv("OPENROUTER_API_KEY"),
};
