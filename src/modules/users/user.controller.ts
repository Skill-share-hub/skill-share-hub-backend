import { NextFunction, Request, Response } from "express";
import * as userService from "./user.service";
import { ApiResponse } from "../../utils/ApiResponse";

/**
 * Get user profile
 * @route GET /api/v1/users/profile
 */
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const role = req.user?.role;

    const user = await userService.getUserProfileService(userId, role);

    return res.status(200).json(
      new ApiResponse("Profile fetched successfully", user)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PATCH /api/v1/users/profile
 */
export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { name, studentProfile, tutorProfile } = req.body;
    let { avatarUrl } = req.body;

    // If a file was uploaded by multer, its location is used
    if (req.file) {
      avatarUrl = (req.file as any).location || (req.file as any).path;
    }

    const updatedUser = await userService.updateUserProfileService(userId, {
      name,
      avatarUrl,
      studentProfile,
      tutorProfile,
    });

    return res.status(200).json(
      new ApiResponse("Profile updated successfully", updatedUser)
    );
  } catch (error) {
    next(error);
  }
};