import { Schema  , Types, model } from "mongoose";

const chatSchema = new Schema({
  userId : {
    type : Types.ObjectId,
    ref : "User"
  },
  contentId : {
    type :Types.ObjectId,
    ref : "Content"
  },
  messages : [
    {
      role : {
        type : String,
        enum : ["system","user","assistant"],
        required : true
      },
      content : {
        type : String,
        required : true
      }
    }
  ]
},{timestamps : true});


const roomChatSchema = new Schema({
  sender : {
    type : Types.ObjectId,
    ref : "User",
    required : true
  },

  message : {
    type :String,
    required : true
  },

  contentId : {
    type : Types.ObjectId,
    ref : "Content",
    required : true
  }

},{timestamps : true});

export const Message = model("Message",chatSchema);
export const RoomChat = model("RoomChat",roomChatSchema);