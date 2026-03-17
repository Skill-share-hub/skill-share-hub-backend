import { Types } from "mongoose";

export interface IPayment {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: "razorpay";
  paymentStatus: "pending" | "completed" | "failed";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  creditsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}
