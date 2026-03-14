import { User } from "./user.model";
import { ApiError } from "../../utils/ApiError";
import "../courses/course.model"; // Ensure Course model is registered for population

export const getUserProfileService = async (userId: string, role: string) => {
  let user;

  const projection = "-passwordHash";
  const roleSpecificExclusion = (role === "tutor" || role === "premiumTutor") 
    ? "-studentProfile" 
    : "-tutorProfile";

  user = await User.findOne({ _id: userId, role: role })
    .select(`${projection} ${roleSpecificExclusion}`);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

export const updateUserProfileService = async (
  userId: string,
  updateData: {
    name?: string;
    avatarUrl?: string;
    studentProfile?: any;
    tutorProfile?: any;
  }
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { name, avatarUrl, studentProfile, tutorProfile } = updateData;

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

  // Profile completion check
  const isStudentComplete = user.name && user.avatarUrl;
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

  // Filter response based on role
  const userObj = user.toObject();
  delete (userObj as any).passwordHash;
  
  if (user.role === "student") {
    delete (userObj as any).tutorProfile;
  } else {
    delete (userObj as any).studentProfile;
  }

  return userObj;
};
