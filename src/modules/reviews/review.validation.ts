import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdSchema = z.string().refine(
  (val) => Types.ObjectId.isValid(val),
  {
    message: 'Invalid ObjectId',
  }
);

export const CreateReviewSchema = z.object({
  courseId: objectIdSchema,
  rating: z.number().min(1).max(5),
  reviewText: z.string().min(1, "Review text cannot be empty").max(1000, "Review text is too long"),
});

export type ICreateReview = z.infer<typeof CreateReviewSchema>;
