import { User } from "../users/user.model";
import { Request, Response } from "express";
import { getAllTutorsService, getAllEnrollmentsService, getEnrollmentByIdService, toggleBlockUserService, getUserDetailsService } from "./admin.service";

export const getAllTutors = async (req: any, res: any, next: any) => {
  try {

    const query = req.query;

    const result = await getAllTutorsService(query);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};
export const toggleBlockUser = async (req: Request, res: Response) => {
const id = req.params.id as string;
  const user = await toggleBlockUserService(id);

  res.status(200).json({
    success: true,
    message: user.isBlocked ? "User banned" : "User unbanned",
    data: user
  });
};

export const getUserDetails = async (req: Request, res: Response, next: any) => {
  try {
    const id = req.params.id as string;

    const data = await getUserDetailsService(id);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getAllEnrollments = async (req: any, res: any, next: any) => {
  try {
    const query = req.query;
    const result = await getAllEnrollmentsService(query);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentById = async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const result = await getEnrollmentByIdService(id);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}