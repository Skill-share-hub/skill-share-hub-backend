import { Request, Response } from "express";
import { User } from "./user.model";

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
    const { name, avatarUrl, studentProfile, tutorProfile } = req.body;

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
        ...user.studentProfile,
        ...studentProfile,
      };
    }

    // Tutor profile (only if tutor or premiumTutor)
    if (
      tutorProfile &&
      (user.role === "tutor" || user.role === "premiumTutor")
    ) {
     if (
  tutorProfile &&
  (user.role === "tutor" || user.role === "premiumTutor")
) {
  user.tutorProfile!.bio =
    tutorProfile.bio ?? user.tutorProfile?.bio;

  user.tutorProfile!.skills =
    tutorProfile.skills ?? user.tutorProfile?.skills;

  user.tutorProfile!.experience =
    tutorProfile.experience ?? user.tutorProfile?.experience;

  user.tutorProfile!.payoutDetails =
    tutorProfile.payoutDetails ?? user.tutorProfile?.payoutDetails;
}
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Profile update failed",
    });
  }
};