import { NextFunction, Request, Response } from 'express';
import { CreateReviewSchema } from './review.validation';
import { ReviewService } from './review.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';

const createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = CreateReviewSchema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(' | ');
      throw new ApiError(400, message);
    }

    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'User not authenticated');

    const review = await ReviewService.createReview(userId, result.data);

    res.status(201).json(
      new ApiResponse('Review submitted successfully', review, true)
    );
  } catch (error: any) {
    next(error);
  }
};

const updateReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const courseId = Array.isArray(id) ? id[0] : id;
    if (!courseId) throw new ApiError(400, 'Course ID is required');

    const result = CreateReviewSchema.pick({ rating: true, reviewText: true }).safeParse(req.body);
    if (!result.success) {
      throw new ApiError(400, "Invalid input data");
    }

    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'User not authenticated');

    const review = await ReviewService.updateReview(userId, courseId, result.data);

    res.status(200).json(
      new ApiResponse('Review updated successfully', review, true)
    );
  } catch (error: any) {
    next(error);
  }
};

const deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const courseId = Array.isArray(id) ? id[0] : id;
    if (!courseId) throw new ApiError(400, 'Course ID is required');

    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'User not authenticated');

    const review = await ReviewService.deleteReview(userId, courseId);

    res.status(200).json(
      new ApiResponse('Review deleted successfully', review, true)
    );
  } catch (error: any) {
    next(error);
  }
};

const getUserReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const courseId = Array.isArray(id) ? id[0] : id;
    if (!courseId) throw new ApiError(400, 'Course ID is required');

    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'User not authenticated');

    const review = await ReviewService.getUserReview(userId, courseId);

    res.status(200).json(
      new ApiResponse('Review fetched successfully', review, true)
    );
  } catch (error: any) {
    next(error);
  }
};

const getCourseReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError(400, 'Course ID is required');

    const courseId = Array.isArray(id) ? id[0] : id;
    const data = await ReviewService.getCourseReviews(courseId);

    res.status(200).json(
      new ApiResponse('Reviews fetched successfully', data, true)
    );
  } catch (error: any) {
    next(error);
  }
};

export const ReviewController = {
  createReview,
  updateReview,
  deleteReview,
  getUserReview,
  getCourseReviews
};
