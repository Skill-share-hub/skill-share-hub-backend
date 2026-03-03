import z from "zod";
import { baseSchema } from "./baseSchema";

export const registerSchema = baseSchema.extend({
  otp: z
    .string({ error: 'OTP is required' })
    .trim()
    .min(1, 'OTP is required'),
}).
  refine((data) => data.password === data.confirmPassword, {
    message: 'Password and confirm password do not match',
    path: ['confirmPassword'],
  })
  .transform(({ confirmPassword: _, ...rest }) => rest);