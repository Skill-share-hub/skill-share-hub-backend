import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId format",
});

export const purchaseSummarySchema = z.object({
  paymentMethod: z.enum(["credit", "payment", "credit_payment"])
});

export const createRazorpayOrderSchema = z.object({
  courseId: objectIdSchema
});

export const verifyPaymentSchema = z.object({
  courseId: objectIdSchema,
  creditsUsed: z.number().min(0).default(0),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string()
});
