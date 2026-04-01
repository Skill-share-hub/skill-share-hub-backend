import { Schema, model, Types } from "mongoose";

export interface IEnrollment {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: "active" | "completed" | "cancelled";
  enrolledAt: Date;
  completedAt?: Date;
  progress: number;
  totalWatchTime : number;
  completedContent : Types.ObjectId[];
  totalContents : number
  courseSnapshot: {
    title: string;
    thumbnail: string;
    price: number;
    courseType: string;
    creditCost?: number;
  };
  createdAt : string
}

const enrollmentSchema = new Schema<IEnrollment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  progress: { type: Number, default: 0 },
  totalContents : { type : Number, required : true},
  totalWatchTime : {
    type : Number,
    default : 0
  },
  courseSnapshot: {
    title: { type: String, required: true },
    thumbnail: { type: String, required: true },
    price: { type: Number, required: true },
    courseType: { type: String, required: true },
    creditCost: { type: Number }
  },

  completedContent: [
    {
      type: Schema.Types.ObjectId,
      ref: "Content",
    }
  ],

}, { timestamps: true });

// Prevent duplicate enrollments
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1 });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrolledAt: -1 });

export const Enrollment = model<IEnrollment>("Enrollment", enrollmentSchema);
