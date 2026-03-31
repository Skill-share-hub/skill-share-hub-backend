import { NextFunction , Request , Response } from "express";
import * as chatbotService from "./chatbot.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { Types } from "mongoose";

export const getChatBotMessages = async (req:Request , res:Response , next:NextFunction) => {
  try{
    const contentId = new Types.ObjectId(req.params.id as string);
    const messages = await chatbotService.getChatService(req.user?._id , contentId );

    res.status(200).json(
      new ApiResponse("chats found!",messages,true)
    );
  }catch(error){
    next(error);
  }
}

export const askQuestionController = async (req:Request , res:Response , next:NextFunction) => {
  try{
    const message = await chatbotService.askAiService({
      userId : req.user?._id,
      ...req.body
    });

    res.status(201).json(
      new ApiResponse("message recieved",message , true)
    );

  }catch(error){
    next(error);
  }
}