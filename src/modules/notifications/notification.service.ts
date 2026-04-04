import Notification from "./notification.model";
import { getIO } from "../../socket/socket.server";

export const createNotification = async ({
  userId,
  title,
  message,
  type = "INFO",
}: {
  userId: string;
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
  io.to(userId).emit("notification", notification);

  return notification;
};

export const getUserNotifications = async (userId: string) => {
  return await Notification.find({ userId })
    .sort({ createdAt: -1 });
};

export const markAsRead = async (notificationId: string, userId: string) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
};

export const markAllAsRead = async (userId: string) => {
  return await Notification.updateMany(
    { userId },
    { isRead: true }
  );
};
