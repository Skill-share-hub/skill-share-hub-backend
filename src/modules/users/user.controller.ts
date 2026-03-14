import { NextFunction, Request, Response } from "express";
import * as userService from "./user.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { UserRole } from "./user.types";

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

export const updateRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { role } = req.body;
    const updatedUser = await userService.updateUserRoleService(userId, role as Extract<UserRole, "tutor" | "student">);
    return res.status(200).json(
      new ApiResponse("Role updated successfully", updatedUser)
    );
  } catch (error) {
    next(error);
  }
}

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