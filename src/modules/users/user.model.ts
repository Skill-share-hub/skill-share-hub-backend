import { Schema, model, Types } from "mongoose";

export type UserRole = "student" | "tutor" | "premiumTutor" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type PayoutMethod = "bank" | "upi" | "stripe";

export interface IUser {
  _id: Types.ObjectId;

  // Basic Auth Data
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  verificationStatus: VerificationStatus;

  // Student Profile (Optional)
  studentProfile?: {
    bio: string;
    skills: string[];
    interests?: string[];
  };

  // Tutor Profile (Optional)
  tutorProfile?: {
    bio: string;
    skills: string[];
    experience?: string;
    totalCreditsEarned: number;
    monetizationEligible: boolean;
    premiumStatusDate?: Date;
    ratingsAverage: number;
    reviewCount: number;
    earningsTotal: number;
    payoutDetails?: {
      method?: PayoutMethod;
      accountInfo?: Record<string, any>;
    };
  };

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    // Basic
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["student", "tutor", "premiumTutor", "admin"],
      default: "student",
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    // Student Profile
    studentProfile: {
      bio: { type: String, default: "" },
      skills: { type: [String], default: [] },
      interests: { type: [String], default: [] },
    },

    // Tutor Profile
    tutorProfile: {
      bio: { type: String, default: "" },
      skills: { type: [String], default: [] },
      experience: { type: String },

      totalCreditsEarned: { type: Number, default: 0 },
      monetizationEligible: { type: Boolean, default: false },
      premiumStatusDate: { type: Date },

      ratingsAverage: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      earningsTotal: { type: Number, default: 0 },

      payoutDetails: {
        method: {
          type: String,
          enum: ["bank", "upi", "stripe"],
        },
        accountInfo: { type: Object },
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });


export const User = model<IUser>("User", userSchema);