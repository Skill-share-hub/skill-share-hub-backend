import { Schema, model, Types } from 'mongoose';

export interface IReview {
  courseId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  reviewText: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per course
reviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });

export const Review = model<IReview>('Review', reviewSchema);
