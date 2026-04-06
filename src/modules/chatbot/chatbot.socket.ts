import { Server, Socket } from "socket.io";
import { User } from "../users/user.model";
import { Content } from "../courses/course.model";
import { ApiError } from "../../utils/ApiError";
import { Enrollment } from "../enrollments/enrollment.model";
import { RoomChat } from "./chatbot.model";


export function chatBotSocket (socket:any,io:Server) {

    socket.on("join_room", async (contentId:string)=>{
      try {

        const content = await Content.findById(contentId).lean();
        if(!content)throw new ApiError(404,"no messages found");
      
        const enrollment = await Enrollment.findOne(
          {userId : socket.user?.userId , courseId : content.courseId}
        ).lean();
        if(!enrollment)throw new ApiError(403,"user not enrolled the course!");

        socket.join(contentId);

      } catch (error:any) {
        socket.emit("chatbot_error",{error : error.message, status : error.status});
      }
    });

    socket.on("send_chatbot_message", async ({message,contentId}:{message:string,contentId:string}) => {
      try{

        if (!message?.trim()) {
          throw new ApiError(400, "Message is required");
        }

        if (!socket.rooms.has(contentId)) {
          throw new ApiError(400, "Join room first");
        }

        const content = await Content.findById(contentId).lean();
        if(!content)throw new ApiError(404,"no messages found");
      
        const enrollment = await Enrollment.findOne(
          {userId : socket.user?.userId , courseId : content.courseId}
        ).lean();
        if(!enrollment)throw new ApiError(403,"user not enrolled the course!");

        const userMessage = await RoomChat.create({
          sender : socket.user?.userId,
          message,
          contentId
        });

        const outputMessage = await userMessage.populate({
          path : "sender",
          select : "name avatarUrl"
        });

        io.to(contentId).emit("receive_chatbot_message", outputMessage);


      }catch(error:any){
        socket.emit("chatbot_error",{error : error.message, status : error.status});
      }
    })

    socket.on("leave_room", (contentId:string)=>{
      socket.leave(contentId);
    })
}