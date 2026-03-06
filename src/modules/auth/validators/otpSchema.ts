import { baseSchema } from "./baseSchema";
import z from "zod";

export const otpSchema = baseSchema.
  refine((data) => data.password === data.confirmPassword, {
    message: 'Password and confirm password do not match',
    path: ['confirmPassword'],
  })
  .transform(({ confirmPassword: _, ...rest }) => rest);