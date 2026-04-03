import { Review } from './review.model';
import { Enrollment } from '../enrollments/enrollment.model';
import { Course } from '../courses/course.model';
import { Types } from 'mongoose';

const recalculateCourseRating = async (courseId: string | Types.ObjectId) => {
  const courseObjectId = typeof courseId === 'string' ? new Types.ObjectId(courseId) : courseId;

  const stats = await Review.aggregate([
    { $match: { courseId: courseObjectId } },
    {
      $group: {
        _id: "$courseId",
        avgRating: { $avg: "$rating" },
        total: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      ratingsAverage: Number(stats[0].avgRating.toFixed(1)),
      ratingsCount: stats[0].total
    });
  } else {
    await Course.findByIdAndUpdate(courseId, {
      ratingsAverage: 0,
      ratingsCount: 0
    });
  }
};

const createReview = async (userId: string, payload: { courseId: string; rating: number; reviewText: string }) => {
  const { courseId, rating, reviewText } = payload;
  const userObjectId = new Types.ObjectId(userId);
  const courseObjectId = new Types.ObjectId(courseId);

  // 1. Check enrollment status
  const enrollment = await Enrollment.findOne({
    userId: userObjectId,
    courseId: courseObjectId
  });

  if (!enrollment) {
    throw new Error("Please enroll in the course first");
  }

  // 2. Check if completed
  if (enrollment.status !== "completed") {
    throw new Error("Please complete the course to write a review");
  }

  // 3. Check if already reviewed
  const existingReview = await Review.findOne({
    userId: userObjectId,
    courseId: courseObjectId
  });

  if (existingReview) {
    throw new Error("Review already submitted");
  }

  // 4. Create review
  const review = await Review.create({
    userId: userObjectId,
    courseId: courseObjectId,
    rating,
    reviewText
  });

  // 5. Update course rating
  await recalculateCourseRating(courseObjectId);

  return review;
};

const updateReview = async (userId: string, courseId: string, payload: { rating: number; reviewText: string }) => {
  const userObjectId = new Types.ObjectId(userId);
  const courseObjectId = new Types.ObjectId(courseId);

  const review = await Review.findOneAndUpdate(
    { userId: userObjectId, courseId: courseObjectId },
    { 
      rating: payload.rating,
      reviewText: payload.reviewText
    },
    { new: true }
  );

  if (!review) {
    throw new Error("Review not found or unauthorized");
  }

  await recalculateCourseRating(courseObjectId);
  return review;
};

const deleteReview = async (userId: string, courseId: string) => {
  const userObjectId = new Types.ObjectId(userId);
  const courseObjectId = new Types.ObjectId(courseId);

  const review = await Review.findOneAndDelete({ userId: userObjectId, courseId: courseObjectId });

  if (!review) {
    throw new Error("Review not found or unauthorized");
  }

  await recalculateCourseRating(courseObjectId);
  return review;
};

const getUserReview = async (userId: string, courseId: string) => {
  const userObjectId = new Types.ObjectId(userId);
  const courseObjectId = new Types.ObjectId(courseId);

  return await Review.findOne({ userId: userObjectId, courseId: courseObjectId });
};

const getCourseReviews = async (courseId: string) => {
  const courseObjectId = new Types.ObjectId(courseId);

  const reviews = await Review.find({ courseId: courseObjectId })
    .populate({
      path: 'userId',
      select: 'name avatarUrl'
    })
    .sort({ createdAt: -1 });

  const stats = await Review.aggregate([
    { $match: { courseId: courseObjectId } },
    {
      $group: {
        _id: "$courseId",
        avgRating: { $avg: "$rating" },
        total: { $sum: 1 }
      }
    }
  ]);

  return {
    averageRating: stats.length > 0 ? Number(stats[0].avgRating.toFixed(1)) : 0,
    totalReviews: stats.length > 0 ? stats[0].total : 0,
    reviews
  };
};

export const ReviewService = {
  createReview,
  updateReview,
  deleteReview,
  getUserReview,
  getCourseReviews
};
