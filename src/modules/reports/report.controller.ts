import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ReportService } from './report.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';

const ReportReasonEnum = ["Inappropriate Content", "Spam or Misleading", "Offensive Language", "Low Quality Content", "Copyright Issue", "Other"] as const;

const CreateCourseReportSchema = z.object({
  courseId: z.string().min(1),
  reason: z.enum(ReportReasonEnum),
  customReason: z.string().optional(),
});

const CreateReviewReportSchema = z.object({
  reviewId: z.string().min(1),
  courseId: z.string().min(1),
  reason: z.enum(ReportReasonEnum),
  customReason: z.string().optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum(["noticed", "resolved"]),
  adminNote: z.string().optional(),
});

const createCourseReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = CreateCourseReportSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(400, "Invalid input data");
    }

    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'User not authenticated');

    const report = await ReportService.createCourseReport(userId, result.data);

    res.status(201).json(
      new ApiResponse('Course reported successfully', report, true)
    );
  } catch (error: any) {
    next(error);
  }
};

const createReviewReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = CreateReviewReportSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(400, "Invalid input data");
    }

    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'User not authenticated');

    const report = await ReportService.createReviewReport(userId, result.data);

    res.status(201).json(
      new ApiResponse('Review reported successfully', report, true)
    );
  } catch (error: any) {
    next(error);
  }
};

const getAdminCourseReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reports = await ReportService.getAdminCourseReports();
    res.status(200).json(
      new ApiResponse('Course reports fetched successfully', reports, true)
    );
  } catch (error: any) {
    next(error);
  }
};

const getAdminReviewReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reports = await ReportService.getAdminReviewReports();
    res.status(200).json(
      new ApiResponse('Review reports fetched successfully', reports, true)
    );
  } catch (error: any) {
    next(error);
  }
};

const updateReportStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const reportId = Array.isArray(id) ? id[0] : id;
    if (!reportId) throw new ApiError(400, "Report ID is required");

    const result = UpdateStatusSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(400, "Invalid status or input");
    }

    const report = await ReportService.updateReportStatus(reportId, result.data);

    res.status(200).json(
      new ApiResponse('Report status updated successfully', report, true)
    );
  } catch (error: any) {
    next(error);
  }
};

const checkCourseReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const cid = Array.isArray(courseId) ? courseId[0] : courseId;
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'User not authenticated');
    
    const hasReported = await ReportService.checkCourseReport(userId, cid);
    res.status(200).json(new ApiResponse('Check completed', { hasReported }, true));
  } catch (error: any) {
    next(error);
  }
};

const checkReviewReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const rid = Array.isArray(reviewId) ? reviewId[0] : reviewId;
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'User not authenticated');
    
    const hasReported = await ReportService.checkReviewReport(userId, rid);
    res.status(200).json(new ApiResponse('Check completed', { hasReported }, true));
  } catch (error: any) {
    next(error);
  }
};

export const ReportController = {
  createCourseReport,
  createReviewReport,
  getAdminCourseReports,
  getAdminReviewReports,
  updateReportStatus,
  checkCourseReport,
  checkReviewReport,
};
