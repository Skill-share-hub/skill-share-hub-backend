import { Schema, model } from "mongoose";
import { IPayment } from "../types/payment.types";

const paymentSchema = new Schema<IPayment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  paymentMethod: { type: String, enum: ["razorpay"], required: true },
  paymentStatus: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  creditsUsed: { type: Number, default: 0 }
}, { timestamps: true });

export const Payment = model<IPayment>("Payment", paymentSchema);
