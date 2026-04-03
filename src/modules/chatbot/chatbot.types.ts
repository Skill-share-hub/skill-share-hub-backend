import { Types } from "mongoose"

export type MessagePayload = {
  userId : Types.ObjectId;
  contentId : Types.ObjectId;
  question : string;
}

export type  MessagesType = {
  role : "system" | "user" | "assistant",
  content : string
}