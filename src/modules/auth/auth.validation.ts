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

export const loginSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address'),

  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required'),
});


