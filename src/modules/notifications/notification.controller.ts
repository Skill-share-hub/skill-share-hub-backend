import { Request, Response } from "express";
import { getUserNotifications, markAsRead,markAllAsRead } from "./notification.service";

export const getNotifications = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const notifications = await getUserNotifications(userId);
  res.json(notifications);
};

export const markAsReadController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  await markAsRead(id, userId);
  
  res.json({ message: "Marked as read" });
};

export const markAllAsReadController = async (req: Request, res: Response) => {
  const userId = req.user.id;
  await markAllAsRead(userId);
  
  res.json({ message: "All marked as read" });
};
