import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../config/jwt';
import { redisClient } from '../../config/redis';
import { sendEmail } from '../../services/mail.service';
import { ApiError } from '../../utils/ApiError';
import { otpTemplate, registerTemplate } from '../../utils/email.templates';
import generateOtp from '../../utils/generateOtp';
import { hashPassword } from '../../utils/hash';
import { User } from '../users/user.model';
import { RegisterInput } from './auth.validation';
import bcrypt from 'bcryptjs';

export interface RegisterResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const registerUser = async (input: RegisterInput): Promise<RegisterResponse> => {
  const existingUser = await User.findOne({ email: input.email }).lean();

  if (existingUser) {
    throw new ApiError(409, 'Email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const isVerified=await verifyOtpService(input.email,input.otp);

  if(!isVerified){
    throw new ApiError(401, 'Invalid otp');
  }
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    isVerified:true
  });

  const tokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  await sendEmail(
  user.email,
  `Welcome to SkillShare Hub, ${user.name}! 🎉`,
  registerTemplate(user.name)
);
  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    },
    tokens: {
      accessToken,
      refreshToken
    }
  };
};

export const loginUser = async (input: LoginInput): Promise<RegisterResponse> => {
  const user = await User.findOne({ email: input.email }).lean();

  if (!user || user.passwordHash === undefined) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const tokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    },
    tokens: {
      accessToken,
      refreshToken
    }
  };
};

export const refreshTokens = async (refreshToken: string): Promise<RegisterResponse> => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).lean();

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken: newRefreshToken
      }
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Refresh token expired');
    }
    throw new ApiError(401, 'Invalid refresh token');
  }
};

export const sendOtpService = async (email: string): Promise<string> => {
  // const user = await User.findOne({ email }).lean();
  // if (!user) {
  //   throw new ApiError(404, 'User not found');
  // }
  const otp = generateOtp();
  const otpHashed=await bcrypt.hash(otp,10)
  await redisClient.set(`otp:${email}`,otpHashed , {EX: 60 * 5});
  await sendEmail(email,'Otp Verification',otpTemplate(otp));
  return otp;
};

export const verifyOtpService = async (email: string, otp: string): Promise<boolean> => {
  const otpHashed = await redisClient.get(`otp:${email}`);
  if (!otpHashed) {
    throw new ApiError(404, 'Otp not found');
  }
  const isVerified = await bcrypt.compare(otp, otpHashed);
  if (!isVerified) {
    throw new ApiError(401, 'Invalid otp');
  }
  await redisClient.del(`otp:${email}`);
  return true;  
};