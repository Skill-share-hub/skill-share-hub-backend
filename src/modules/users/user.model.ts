import { Schema, model, Types } from "mongoose";
import { UserRole, PayoutMethod } from "./user.types";

export interface IUser {
  _id: Types.ObjectId;

  name: string;
  avatarUrl?: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  isVerified: boolean;
  isProfileCompleted: boolean;
  isBlocked: boolean;
  provider: "local" | "google";
  googleId?: string;

  savedCourses: Types.ObjectId[];
  enrolledCourses: Types.ObjectId[];

  studentProfile?: {
    bio: string;
    skills: string[];
    interests?: string[];
  };

  tutorProfile?: {
    bio: string;
    skills: string[];
    createdCourses: Types.ObjectId[];
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

  userTransactions: Types.ObjectId[];

  userCreditBalance: number;

  userWatchHours : number ;

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

    passwordHash: { type: String },

    role: {
      type: String,
      enum: ["student", "tutor", "premiumTutor", "admin"],
      default: "student",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
  type: Boolean,
  default: false
},

    // Auth
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    
    googleId: {
      type: String,
    },

    // Saved Courses
    savedCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
        default: [],
      },
    ],
    
    enrolledCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Enrollment"
      },
    ],

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

      createdCourses: [
        {
          type: Schema.Types.ObjectId,
          ref: "Course",
        },
      ],

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

    userCreditBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);