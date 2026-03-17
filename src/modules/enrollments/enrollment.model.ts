import { Schema, model, Types } from "mongoose";

export interface IEnrollment {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: "active" | "completed" | "cancelled";
  enrolledAt: Date;
  completedAt?: Date;
  progress: number;
  completedContent : Types.ObjectId[];
  totalContents : number
}

const enrollmentSchema = new Schema<IEnrollment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  progress: { type: Number, default: 0 },
  totalContents : { type : Number, required : true},

  completedContent: [
    {
      type: Schema.Types.ObjectId,
      ref: "Content",
    }
  ],

}, { timestamps: true });

// Prevent duplicate enrollments
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment = model<IEnrollment>("Enrollment", enrollmentSchema);
