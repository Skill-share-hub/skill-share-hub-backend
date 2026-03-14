import { Types } from "mongoose";

export interface ITransaction {
  userId : Types.ObjectId;
  amount : number;
  type : "credit_purchase" | "credit_withdraw" | "course_purchase";
  method : "razor_pay" | "wallet";
  status : "completed" | "pending" | "initialized" | "rejected";
  razorpayOrderId : string
  razorpayPaymentId : string
  createdAt : string
}