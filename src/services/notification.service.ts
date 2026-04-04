import { getIO } from "../socket/socket.server";

export const sendNotification = (userId: string, message: string) => {
  const io = getIO();

  io.to(userId).emit("notification", {
    message,
    createdAt: new Date(),
  });
};