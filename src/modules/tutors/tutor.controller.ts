import { Request, Response, NextFunction } from "express";
import { getTutorCoursesService } from "./tutor.service";
import { ApiResponse } from "../../utils/ApiResponse";

export const getTutorCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const tutorId = req.user?._id;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const courses = await getTutorCoursesService(tutorId, page, limit);

    res.status(200).json(
      new ApiResponse("Tutor courses fetched successfully", courses, true)
    );

  } catch (error) {
    next(error);
  }
};