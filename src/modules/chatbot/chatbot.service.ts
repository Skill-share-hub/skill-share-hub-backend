import { Types } from "mongoose";
import { askAi } from "../../services/askai.service";
import { ApiError } from "../../utils/ApiError";
import { Content } from "../courses/course.model";
import { Message, RoomChat } from "./chatbot.model";
import { MessagePayload, MessagesType } from "./chatbot.types";
import { Enrollment } from "../enrollments/enrollment.model";

export const askAiService = async (payload:MessagePayload) => {

  const content = await Content.findById(payload.contentId).lean();
  if(!content)throw new ApiError(404,"no messages found");

  const enrollment = await Enrollment.findOne(
    {userId : payload.userId , courseId : content.courseId}
  ).lean();
  if(!enrollment)throw new ApiError(403,"user not enrolled the course!");

  const chats = await Message
  .findOne({userId : payload.userId, contentId : payload.contentId})

  if(!chats)throw new ApiError(404,"no messages found");

  chats?.messages.push({role : "user",content : payload.question});
  await chats.save();

  let response:any = {}

  try{
    response = await askAi(chats.messages,"mistralai/mistral-small-3.1-24b-instruct");
  }catch(error){
    response = await askAi(chats.messages,"meta-llama/llama-3.1-8b-instruct");
  }

  const aiRes = {role : "assistant" , content : response.content}

  chats.messages.push(aiRes);
  await chats.save();

  return aiRes ;
  
}

export const getChatService = async (userId:Types.ObjectId,contentId:Types.ObjectId ) => {

  const content = await Content.findOne(contentId).lean();
  if(!content)throw new ApiError(404,"No content found!");

  const enrollment = await Enrollment.findOne(
    {userId : userId , courseId : content.courseId}
  ).lean();
  if(!enrollment)throw new ApiError(403,"user not enrolled the course!");

  const chat = await Message.findOne({userId,contentId}).lean();

  if(!chat){
    const systemPrompt = `
      You are a friendly AI tutor welcoming a student.

      Context:
      Title: ${content.title}
      Summary: ${content.summary}

      - Greet the user warmly
      - Introduce the course in a simple and engaging way
      - Briefly explain what they will learn
      - Keep it short (3-5 lines)
      - Sound natural and friendly (not robotic)
      - Keep formatting simple
    `;
    const messages:MessagesType[] = [{role : "system" , content : systemPrompt}]

    const response = await askAi(messages,"mistralai/mistral-small-3.1-24b-instruct");

    const chatbot = await Message.create({
      userId,
      contentId,
      messages : [
        {role : "assistant" , content : response.content}
      ],
    });

    return chatbot.messages ;
  }

  return chat.messages ;
}

export const getRoomMessages = async (contentId:string,limit:number) => {

  const messages = await RoomChat.find({contentId})
  .populate({
    path : "sender",
    select : "name avatarUrl"
  })
  .sort({
    createdAt : 1
  })
  .limit(limit)

  return messages ;
}