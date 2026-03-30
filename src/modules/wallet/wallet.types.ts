import { Types } from "mongoose";

export interface ITransaction {
  userId : Types.ObjectId;
  amount : number;
  type : "credit_purchase" | "credit_withdraw" | "course_purchase" | "tutor_earning" | "platform_commission";
  method : "razor_pay" | "wallet";
  status : "completed" | "pending" | "initialized" | "rejected";
  razorpayOrderId? : string;
  razorpayPaymentId? : string;
  relatedId? : Types.ObjectId;
  createdAt? : Date;
  currency :number;
  creditBalance : number;
  platformCommission?: number;
}