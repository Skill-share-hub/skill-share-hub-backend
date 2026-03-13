import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
  
  studentProfile: z.object({
    bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
    skills: z.array(z.string()).optional(),
  }).optional(),

  tutorProfile: z.object({
    bio: z.string().max(1000, "Bio cannot exceed 1000 characters").optional(),
    skills: z.array(z.string()).optional(),
    experience: z.string().optional(),
    payoutDetails: z.object({
      method: z.enum(["bank", "upi", "stripe"]).optional(),
      accountInfo: z.record(z.string(), z.any()).optional(),
    }).optional(),
  }).optional(), 
});
 