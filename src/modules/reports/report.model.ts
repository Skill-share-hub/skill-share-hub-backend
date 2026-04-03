import { Schema, model, Types, Document } from "mongoose";

const Reasons = [
  "Inappropriate Content",
  "Spam or Misleading",
  "Offensive Language",
  "Low Quality Content",
  "Copyright Issue",
  "Other",
] as const;

export type IReportReason = typeof Reasons[number];
export type IReportStatus = "pending" | "noticed" | "resolved";

export interface ICourseReport extends Document {
  courseId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reason: IReportReason;
  customReason?: string;
  status: IReportStatus;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewReport extends Document {
  reviewId: Types.ObjectId;
  courseId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reason: IReportReason;
  customReason?: string;
  status: IReportStatus;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseReportSchema = new Schema<ICourseReport>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, enum: Reasons, required: true },
    customReason: { type: String },
    status: { type: String, enum: ["pending", "noticed", "resolved"], default: "pending" },
    adminNote: { type: String },
  },
  { timestamps: true }
);

const reviewReportSchema = new Schema<IReviewReport>(
  {
    reviewId: { type: Schema.Types.ObjectId, ref: "Review", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, enum: Reasons, required: true },
    customReason: { type: String },
    status: { type: String, enum: ["pending", "noticed", "resolved"], default: "pending" },
    adminNote: { type: String },
  },
  { timestamps: true }
);

// Optional: Prevent duplicate reports from same user on same item
courseReportSchema.index({ courseId: 1, reportedBy: 1 }, { unique: true });
reviewReportSchema.index({ reviewId: 1, reportedBy: 1 }, { unique: true });

export const CourseReport = model<ICourseReport>("CourseReport", courseReportSchema);
export const ReviewReport = model<IReviewReport>("ReviewReport", reviewReportSchema);
