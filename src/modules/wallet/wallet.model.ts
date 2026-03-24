import { Schema, model } from "mongoose";
import { ITransaction } from "./wallet.types";


const transactionSchema = new Schema<ITransaction>({
  userId : {
    type : Schema.Types.ObjectId,
    ref : "User",
    required : true
  },

  amount : {
    type : Number,
    required : true
  },

  currency : {
    type : Number,
    required : true
  },

  creditBalance : {
    type : Number,
    required : true
  },

  type : {
    type : String,
    enum : ["credit_purchase" , "credit_withdraw" , "course_purchase"],
    required : true
  },

  method : {
    type : String,
    enum : ["razor_pay" , "wallet"],
    required : true
  },

  status : {
    type : String,
    enum : ["completed" , "pending" , "initialized" , "rejected"],
    required : true
  },

  razorpayOrderId: {
    type : String,
    required : true
  },

  razorpayPaymentId: String

},{timestamps : true});


export const Transaction = model<ITransaction>("Transaction",transactionSchema);