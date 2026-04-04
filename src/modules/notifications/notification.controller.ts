import { Request, Response } from "express";
import { getUserNotifications, markAsRead,markAllAsRead } from "./notification.service";
import { ApiError } from "../../utils/ApiError";

export const getNotifications = async (req: Request, res: Response) => {
  const userId = req.user._id;
  if(!userId){
    throw new ApiError(401,"Unauthorized")  
  }
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await getUserNotifications(userId, page, limit);
  res.json(result);
};

export const markAsReadController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id;
  await markAsRead(id as string, userId);
  
  res.json({ message: "Marked as read" });
};

export const markAllAsReadController = async (req: Request, res: Response) => {
  const userId = req.user._id;
  await markAllAsRead(userId);
  
  res.json({ message: "All marked as read" });
};
