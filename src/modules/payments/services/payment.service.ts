import { Course } from "../../courses/course.model";
import { User } from "../../users/user.model";
import { Payment } from "../models/payment.model";
import { Enrollment } from "../../courses/enrollment.model";
import { Transaction } from "../../wallet/wallet.model";
import { CREDIT_VALUE } from "../../wallet/wallet.constant";
import { ApiError } from "../../../utils/ApiError";
import { razorpayService } from "./razorpay.service";
import crypto from "crypto";
import { env } from "../../../config/env";
import mongoose from "mongoose";

export const getPurchaseSummary = async (
  courseId: string,
  userId: string,
  paymentMethod: "credit" | "payment" | "credit_payment"
) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const coursePrice = course.price || 0;
  const userCredits = user.userCreditBalance || 0;

  let creditsApplied = 0;
  let paymentAmount = coursePrice;
  let paymentRequired = true;

  if (paymentMethod === "credit" || paymentMethod === "credit_payment") {
    if (paymentMethod === "credit" && course.courseType === "credit") {
        creditsApplied = course.creditCost || 0;
        paymentAmount = 0;
        paymentRequired = false;
    } else {
        const maxCreditsForPrice = Math.floor(coursePrice / CREDIT_VALUE);
        creditsApplied = Math.min(userCredits, maxCreditsForPrice);
        const discountAmount = creditsApplied * CREDIT_VALUE;
        paymentAmount = coursePrice - discountAmount;
        paymentRequired = paymentAmount > 0;
    }
  } else if (paymentMethod === "payment") {
    creditsApplied = 0;
    paymentAmount = coursePrice;
    paymentRequired = paymentAmount > 0;
  }

  return {
    coursePrice,
    userCredits,
    creditsApplied,
    paymentAmount,
    paymentRequired
  };
};

export const createRazorpayOrder = async (courseId: string, userId: string) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const coursePrice = course.price || 0;
  const userCredits = user.userCreditBalance || 0;
  const maxCreditsForPrice = Math.floor(coursePrice / CREDIT_VALUE);
  const creditsApplied = Math.min(userCredits, maxCreditsForPrice);
  
  const discountAmount = creditsApplied * CREDIT_VALUE;
  const remainingAmount = coursePrice - discountAmount;

  if (remainingAmount <= 0) {
     throw new ApiError(400, "Course can be purchased entirely with credits");
  }

  const order = await razorpayService.createOrder({
    amount: remainingAmount * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}_${userId}`
  });

  await Payment.create({
    userId,
    courseId,
    amount: remainingAmount,
    currency: "INR",
    paymentMethod: "razorpay",
    paymentStatus: "pending",
    razorpayOrderId: order.id,
    creditsUsed: creditsApplied
  });

  return {
    orderId: order.id,
    amount: remainingAmount,
    currency: "INR"
  };
};

export const purchaseWithCredits = async (courseId: string, userId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const course = await Course.findById(courseId).session(session);
    if (!course) throw new ApiError(404, "Course not found");

    const user = await User.findById(userId).session(session);
    if (!user) throw new ApiError(404, "User not found");

    const costInCredits = course.courseType === "credit" && course.creditCost ? course.creditCost : Math.ceil(course.price / CREDIT_VALUE);

    if (user.userCreditBalance < costInCredits) {
      throw new ApiError(400, "Insufficient credits");
    }

    user.userCreditBalance -= costInCredits;
    await user.save({ session });

    await Transaction.create([{
      userId,
      amount: costInCredits,
      method: "wallet",
      status: "completed",
      type: "course_purchase",
      razorpayOrderId: `wallet_${Date.now()}`
    }], { session });

    const enrollment = new Enrollment({
      userId,
      courseId,
      status: "active"
    });
    await enrollment.save({ session });
    
    course.totalEnrollments = (course.totalEnrollments || 0) + 1;
    await course.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: "Course purchased with credits"
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const verifyRazorpayPayment = async (
  payload: {
    courseId: string;
    creditsUsed: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
  userId: string
) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, creditsUsed } = payload;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid signature");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, userId, courseId },
      {
        paymentStatus: "completed",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      },
      { session, new: true }
    );

    if (!payment) {
        throw new ApiError(404, "Pending payment record not found");
    }

    const user = await User.findById(userId).session(session);
    if (!user) throw new ApiError(404, "User not found");
    
    const course = await Course.findById(courseId).session(session);
    if (!course) throw new ApiError(404, "Course not found");

    if (creditsUsed > 0) {
      if (user.userCreditBalance < creditsUsed) {
        throw new ApiError(400, "Insufficient credits to cover the used amount");
      }
      user.userCreditBalance -= creditsUsed;
      await user.save({ session });

      await Transaction.create([{
        userId,
        amount: creditsUsed,
        method: "wallet",
        status: "completed",
        type: "course_purchase",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id
      }], { session });
    }

    const existingEnrollment = await Enrollment.findOne({ userId, courseId }).session(session);
    if (existingEnrollment) {
      throw new ApiError(400, "Already enrolled in this course");
    }

    await Enrollment.create([{
      userId,
      courseId,
      status: "active"
    }], { session });
    
    course.totalEnrollments = (course.totalEnrollments || 0) + 1;
    await course.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: "Payment verified and course enrolled"
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
