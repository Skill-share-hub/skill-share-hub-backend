import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../config/jwt';
import { ApiError } from '../../utils/ApiError';
import { comparePassword, hashPassword } from '../../utils/hash';
import { User } from '../users/user.model';
import { LoginInput, RegisterInput } from './auth.validation';

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

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash
  });

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

export const googleLoginUser = async (payload: any): Promise<RegisterResponse> => {
  const { email, name, picture, sub } = payload;

  if (!email) {
    throw new ApiError(400, 'Google email not provided');
  }

  let user = await User.findOne({ email });

  // If user exists but is local → link account
  if (user && user.provider === 'local') {
    user.provider = 'google';
    user.googleId = sub;
    user.verificationStatus = 'verified';
    user.avatarUrl = picture || user.avatarUrl;
    await user.save();
  }

  // If no user → create new Google user
  if (!user) {
    user = await User.create({
      name,
      email,
      avatarUrl: picture,
      provider: 'google',
      googleId: sub,
      verificationStatus: 'verified',
      role: 'student'
    });
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