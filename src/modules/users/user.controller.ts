import { Request, Response } from "express";
import { User } from "./user.model";
import { ApiError } from "../../utils/ApiError";

// Get user profile

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId)
      .select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { name, avatarUrl,studentProfile, tutorProfile } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Basic updates
    if (name) user.name = name;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    // Student profile
    if (studentProfile) {
      user.studentProfile = {
        bio: "",
        skills: [],
        ...(user.studentProfile || {}),
        ...studentProfile,
      };
    }

    // Tutor profile update
    if (tutorProfile) {
      if (user.role === "student") {
        user.role = "tutor";
      }

      // Ensure tutorProfile is initialized if this is a new tutor
      if (!user.tutorProfile) {
        user.tutorProfile = {
          bio: "",
          skills: [],
          createdCourses: [],
          totalCreditsEarned: 0,
          monetizationEligible: false,
          ratingsAverage: 0,
          reviewCount: 0,
          earningsTotal: 0,
        };
      }

      // Only update fields allowed to be changed by the user
      if (tutorProfile.bio !== undefined) user.tutorProfile.bio = tutorProfile.bio;
      if (tutorProfile.skills !== undefined) user.tutorProfile.skills = tutorProfile.skills;
      if (tutorProfile.experience !== undefined) user.tutorProfile.experience = tutorProfile.experience;
      
      if (tutorProfile.payoutDetails) {
        user.tutorProfile.payoutDetails = {
          ...user.tutorProfile.payoutDetails,
          ...tutorProfile.payoutDetails,
        };
      }
    }
    
const isStudentComplete =
  user.name &&
  user.avatarUrl;

const isTutorComplete =
  user.name &&
  user.avatarUrl &&
  user.tutorProfile?.bio &&
  user.tutorProfile?.skills?.length;

if (user.role === "student") {
  user.isProfileCompleted = Boolean(isStudentComplete);
}

if (user.role === "tutor" || user.role === "premiumTutor") {
  user.isProfileCompleted = Boolean(isTutorComplete);
}
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch { 
     throw new ApiError(500, "Profile update failed!");
  }
};