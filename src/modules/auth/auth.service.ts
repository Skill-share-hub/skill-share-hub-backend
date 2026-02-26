import { generateAccessToken, generateRefreshToken } from '../../config/jwt';
import { ApiError } from '../../utils/ApiError';
import { hashPassword } from '../../utils/hash';
import { User } from '../users/user.model';
import { RegisterInput } from './auth.validation';

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