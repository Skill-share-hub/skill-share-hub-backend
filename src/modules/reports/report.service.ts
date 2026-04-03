import { Types } from "mongoose";
import { CourseReport, ReviewReport, IReportStatus, IReportReason } from "./report.model";
import { Enrollment } from "../enrollments/enrollment.model";
import { ApiError } from "../../utils/ApiError";

const createCourseReport = async (
  userId: string,
  payload: { courseId: string; reason: IReportReason; customReason?: string }
) => {
  const { courseId, reason, customReason } = payload;
  const userObjectId = new Types.ObjectId(userId);
  const courseObjectId = new Types.ObjectId(courseId);

  // 1. Check enrollment status
  const enrollment = await Enrollment.findOne({
    userId: userObjectId,
    courseId: courseObjectId,
  });

  if (!enrollment) {
    throw new ApiError(400, "Please enroll in the course first");
  }

  // 2. Allow ONLY if completed
  if (enrollment.status !== "completed") {
    throw new ApiError(403, "Please complete the course to report");
  }

  // 3. Create report (Index prevents duplicate user reports on same item)
  try {
    const report = await CourseReport.create({
      courseId: courseObjectId,
      reportedBy: userObjectId,
      reason,
      customReason,
    });
    return report;
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(400, "You have already reported this course");
    }
    throw error;
  }
};

const createReviewReport = async (
  userId: string,
  payload: { reviewId: string; courseId: string; reason: IReportReason; customReason?: string }
) => {
  const { reviewId, courseId, reason, customReason } = payload;
  const userObjectId = new Types.ObjectId(userId);
  const reviewObjectId = new Types.ObjectId(reviewId);
  const courseObjectId = new Types.ObjectId(courseId);

  try {
    const report = await ReviewReport.create({
      reviewId: reviewObjectId,
      courseId: courseObjectId,
      reportedBy: userObjectId,
      reason,
      customReason,
    });
    return report;
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(400, "You have already reported this review");
    }
    throw error;
  }
};

const checkCourseReport = async (userId: string, courseId: string) => {
  const report = await CourseReport.findOne({
    reportedBy: new Types.ObjectId(userId),
    courseId: new Types.ObjectId(courseId),
  });
  return !!report;
};

const checkReviewReport = async (userId: string, reviewId: string) => {
  const report = await ReviewReport.findOne({
    reportedBy: new Types.ObjectId(userId),
    reviewId: new Types.ObjectId(reviewId),
  });
  return !!report;
};

const getAdminCourseReports = async () => {
  return await CourseReport.find()
    .populate("courseId", "title")
    .populate("reportedBy", "name email")
    .sort({ createdAt: -1 });
};

const getAdminReviewReports = async () => {
  return await ReviewReport.find()
    .populate("reviewId", "reviewText")
    .populate("courseId", "title")
    .populate("reportedBy", "name email")
    .sort({ createdAt: -1 });
};

const updateReportStatus = async (
  id: string,
  payload: { status: IReportStatus; adminNote?: string }
) => {
  const { status, adminNote } = payload;
  
  // Find in both collections (simplifying since id will be unique across both if needed, but let's be explicit)
  let report = await (CourseReport.findById(id) || ReviewReport.findById(id));
  
  // Find report and determine collection
  let isCourseReport = true;
  let reportDoc = await CourseReport.findById(id);
  
  if (!reportDoc) {
    reportDoc = await ReviewReport.findById(id);
    isCourseReport = false;
  }

  if (!reportDoc) {
    throw new ApiError(404, "Report not found");
  }

  // Flow: pending → noticed → resolved
  // Rule: Only allow resolved AFTER noticed
  if (status === "resolved" && reportDoc.status !== "noticed") {
    throw new ApiError(400, "Only allow resolved after noticed");
  }

  if (status === "noticed" && reportDoc.status !== "pending") {
    throw new ApiError(400, "Status must be pending to mark as noticed");
  }

  // Update
  reportDoc.status = status;
  if (adminNote) {
    reportDoc.adminNote = adminNote;
  }
  
  await reportDoc.save();
  return reportDoc;
};

export const ReportService = {
  createCourseReport,
  createReviewReport,
  getAdminCourseReports,
  getAdminReviewReports,
  updateReportStatus,
  checkCourseReport,
  checkReviewReport,
};
