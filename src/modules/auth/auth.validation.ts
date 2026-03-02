import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters'),

    email: z
      .string({ error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Invalid email address'),

    password: z
      .string({ error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
      .regex(/[a-z]/, 'Password must include at least one lowercase letter')
      .regex(/[0-9]/, 'Password must include at least one number'),
  const { name, email, password, confirmPassword } = body as Record<string, unknown>;

    confirmPassword: z.string({
      error: 'Confirm password is required',
    }),

    otp: z
      .string({ error: 'OTP is required' })
      .trim()
      .min(1, 'OTP is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password and confirm password do not match',
    path: ['confirmPassword'],
  })
  .transform(({ confirmPassword: _, ...rest }) => rest);

  if (typeof password !== 'string' || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }
  if (confirmPassword !== password) {
    throw new ApiError(400, 'Password and confirm password not match');
  }

  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password
  };
};

export interface LoginInput {
  email: string;
  password: string;
}

export const validateLoginInput = (body: unknown): LoginInput => {
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Request body is required');
  }

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== 'string' || !email.trim()) {
    throw new ApiError(400, 'Email is required');
  }

  if (typeof password !== 'string' || !password) {
    throw new ApiError(400, 'Password is required');
  }

  return {
    email: email.trim().toLowerCase(),
    password
  };
};
