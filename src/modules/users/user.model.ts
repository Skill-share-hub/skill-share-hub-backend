import { Schema, model, Types } from "mongoose";
import { UserRole, PayoutMethod } from "./user.types";

export interface IUser {
  _id: Types.ObjectId;

  // Basic Auth Data
  name: string;
  avatarUrl?: string;
  email: string;
  passwordHash?: string; // ✅ optional for Google users
  role: UserRole;
  isVerified: boolean;

  // 🔐 Auth Provider
  provider: "local" | "google";
  googleId?: string;

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
    avatarUrl: { type: String, default: "" },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    passwordHash: { type: String }, // ✅ not required

    role: {
      type: String,
      enum: ["student", "tutor", "premiumTutor", "admin"],
      default: "student",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // 🔐 Google Auth Fields
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
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

export const User = model<IUser>("User", userSchema);