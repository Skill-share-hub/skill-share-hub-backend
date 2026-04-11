import Notification from "./notification.model";
import { getIO } from "../../socket/socket.server";
import mongoose from "mongoose";

export const createNotification = async ({
  userId,
  title,
  message,
  type = "INFO",
}: {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type?: string;
}) => {
  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
  });

  const io = getIO();
  io.to(userId.toString()).emit("notification", notification);

  return notification;
};

export const getUserNotifications = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await Notification.countDocuments({ userId });
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    unreadCount
  };
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { returnDocument: 'after' }
  );
  return notification;
};

export const markAllAsRead = async (userId: string) => {
  const notification = await Notification.updateMany(
    { userId },
    { isRead: true }
  );
  return notification;
};
