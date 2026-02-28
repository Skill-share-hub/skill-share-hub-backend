import { ApiError } from '../../utils/ApiError';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export const validateRegisterInput = (body: unknown): RegisterInput => {
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Request body is required');
  }

  const { name, email, password,confirmPassword } = body as Record<string, unknown>;

  if (typeof name !== 'string' || name.trim().length < 2) {
    throw new ApiError(400, 'Name must be at least 2 characters');
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'Invalid email address');
  }

  if (typeof password !== 'string' || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }
  if(confirmPassword!==password){
    throw new ApiError(400, 'Password and confirm password not match');
  }

  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password
  };
};