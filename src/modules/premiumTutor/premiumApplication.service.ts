import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { deleteFromS3 } from "../../utils/deleteFromS3";
import { PremiumApplication } from "./premiumApplication.model";
import { GetAllApplicationsQuery, SubmitApplicationInput } from "./premiumApplication.types";
import { User } from "../users/user.model";
import { createNotification } from "../notifications/notification.service";

export const submitApplication = async (data: SubmitApplicationInput) => {
  // Block if a pending/approved application already exists

  const existing = await PremiumApplication.findOne({
    tutorId: data.tutorId,
    status: { $in: ["pending", "approved"] },
  });


  if (existing) {
    throw new Error(
      existing.status === "approved"
        ? "You are already a premium tutor."
        : "You already have a pending application."
    );
  }

  const application = await PremiumApplication.create(data);
  return application;
};

// Get application status for a tutor
export const getApplicationStatus = async (tutorId: string) => {
  const application = await PremiumApplication.findOne({ tutorId })
    .sort({ createdAt: -1 }) // latest application
    .select("status rejectionReason createdAt reviewedAt documents");

  if (!application) {
    throw new Error("No application found for this tutor.");
  }

  return application;
};


// Delete a rejected application (cleanup S3 + DB)
export const deleteApplication = async (
  applicationId: string,
  tutorId: string
) => {
  const application = await PremiumApplication.findOne({
    _id: applicationId,
    tutorId,
  });

  if (!application) {
    throw new Error("Application not found.");
  }

  if (application.status !== "rejected") {
    throw new Error("Only rejected applications can be deleted.");
  }

  // Delete all documents from S3
  const s3DeletePromises = application.documents
    .filter((doc) => doc.s3Key)
    .map((doc) => deleteFromS3(doc.s3Key as string));
  await Promise.all(s3DeletePromises);
  await application.deleteOne();

  return { message: "Application deleted successfully." };
};


// Resubmit — delete old rejected one, submit fresh
export const resubmitApplication = async (
  applicationId: string,
  data: SubmitApplicationInput
) => {
  const existing = await PremiumApplication.findOne({
    _id: applicationId,
    tutorId: data.tutorId,
  });

  if (!existing) {
    throw new Error("Application not found.");
  }

  if (existing.status !== "rejected") {
    throw new Error("Only rejected applications can be resubmitted.");
  }

  // Delete old S3 files
  const s3DeletePromises = existing.documents
    .filter((doc) => doc.s3Key)
    .map((doc) => deleteFromS3(doc.s3Key as string));


  await Promise.all(s3DeletePromises);
  await existing.deleteOne();

  // Create fresh application
  const newApplication = await PremiumApplication.create(data);
  return newApplication;
};


//Admin



export const getAllApplications = async (query: GetAllApplicationsQuery) => {
  const {
    page = 1,limit = 10,
    status,search,
    sortBy = "createdAt", sortOrder = "desc"} = query;

  const skip = (page - 1) * limit;
  const filter: Record<string, any> = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.fullName = { $regex: search, $options: "i" }; 
  }

  const [applications, total] = await Promise.all([
    PremiumApplication.find(filter)
      .populate("tutorId", "name email profilePhoto")
      .select("fullName status experience  yearsOfExperience createdAt reviewedAt")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit),

    PremiumApplication.countDocuments(filter), 
  ]);

  return {
    applications,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

export const getApplicationStats = async () => {
  const [total, pending, approved, rejected] = await Promise.all([
    PremiumApplication.countDocuments(),
    PremiumApplication.countDocuments({ status: "pending" }),
    PremiumApplication.countDocuments({ status: "approved" }),
    PremiumApplication.countDocuments({ status: "rejected" }),
  ]);

  return { total, pending, approved, rejected };
};

export const getApplicationById = async (id: string) => {
  
  const application = await PremiumApplication.findById(id)
    .populate("tutorId", "name email profilePhoto")
    .populate("reviewedBy", "name email");

  if (!application) throw new Error("Application not found.");
  return application;
};

export const approveApplication = async (adminId: string, applicationId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
  const application = await PremiumApplication.findById(applicationId).session(session);

  if (!application) throw new ApiError(404, "Application not found.");
  if (application.status === "approved") throw new ApiError(400, "Application already approved.");
  if (application.status === "rejected") throw new ApiError(400, "Application already rejected.");

  application.status = "approved";
  application.reviewedBy = new mongoose.Types.ObjectId(adminId);
  application.reviewedAt = new Date();

  await application.save({session});
  await User.findByIdAndUpdate(application.tutorId, { role: "premiumTutor" }, { session, new: true });
  await session.commitTransaction();

  await createNotification({
  userId: application.tutorId,
  title: "Account Approved",
  message: "Your tutor account is approved!",
  type: "SUCCESS",
});

  return application;
  }
  catch(error){
    await session.abortTransaction();
    throw error;
  }
  finally{
    await session.endSession();
  }
};

export const rejectApplication = async (
  adminId: string,
  applicationId: string,
  rejectionReason: string
) => {
  const application = await PremiumApplication.findById(applicationId);

  if (!application) throw new ApiError(404, "Application not found.");
  if (application.status === "approved") throw new ApiError(400,"Application already approved.");
  if (application.status === "rejected") throw new ApiError(400,"Application already rejected.");

  if (!rejectionReason || rejectionReason.trim().length < 10) {
    throw new ApiError(400,"Rejection reason must be at least 10 characters.");
  }

  application.status = "rejected";
  application.rejectionReason = rejectionReason;
  application.reviewedBy = new mongoose.Types.ObjectId(adminId);
  application.reviewedAt = new Date();

  await application.save();

  await createNotification({
  userId: application.tutorId,
  title: "Account Rejected",
  message: "Your tutor account is rejected!",
  type: "ERROR",
});
  return application;
};