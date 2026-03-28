import mongoose from "mongoose";

const premiumApplicationSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // --- Personal Info ---
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    nationalIdNumber: { type: String },

    // --- Qualifications ---
    highestDegree: {
      type: String,
      enum: ["diploma", "bachelor", "master", "phd", "other"],
      required: true,
    },
    fieldOfStudy: { type: String, required: true },
    institution: { type: String, required: true },
    graduationYear: { type: Number },

    // --- Teaching Details ---
    subjectsTaught: { type: [String], required: true },
    teachingLanguages: { type: [String], default: ["English"] },
    yearsOfExperience: { type: Number, required: true },
    experience: { type: String, required: true }, // detailed bio/description

    // --- Documents (S3) ---
    documents: [
      {
        url: String,
        s3Key: String,      // replaces public_id, used for S3 deletion
        fileType: {
  type: String,
},
        fileName: String,
      },
    ],

    // --- Application Status ---
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const PremiumApplication = mongoose.model("PremiumApplication", premiumApplicationSchema);