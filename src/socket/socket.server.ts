import { Server } from "socket.io";
import { env } from "../config/env";
import { chatBotSocket } from "../modules/chatbot/chatbot.socket";
import jwt from 'jsonwebtoken'

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      credentials : true
    },
  });

  io.use((socket: any, next) => {
    try {
      const rawCookies = socket.handshake.headers.cookie;

      if (!rawCookies) {
        return next(new Error("No cookies found"));
      }

      const token = rawCookies
      .split("; ")
      .find((row:string) => row.startsWith("accessToken="))
      ?.split("=")[1];

      if (!token) {
        return next(new Error("No token"));
      }

      const decoded = jwt.verify(token, env.jwtAccessSecret) as any;

      socket.user = decoded;

      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("join", (userId: string) => {
      socket.join(userId);
    });

    chatBotSocket(socket,io)


    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};