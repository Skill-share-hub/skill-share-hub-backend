import { Course } from "../../courses/course.model";
import { User } from "../../users/user.model";
import { Payment } from "../models/payment.model";
import { Enrollment } from "../../enrollments/enrollment.model";
import { Transaction } from "../../wallet/wallet.model";
import { CREDIT_VALUE } from "../../wallet/wallet.constant";
import { ApiError } from "../../../utils/ApiError";
import { razorpayService } from "./razorpay.service";
import crypto from "crypto";
import { env } from "../../../config/env";
import mongoose from "mongoose";
import { COURSE_ENROLLMENT_COMMISSION } from "../const/payments.content";
import { createNotification } from "../../notifications/notification.service";

export const getPurchaseSummary = async (
  courseId: string,
  userId: string,
  paymentMethod: "credit" | "payment" | "credit_payment"
) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const existingEnrollment = await Enrollment.findOne({ userId, courseId });
  if (existingEnrollment) {
    throw new ApiError(400, "You are already enrolled in this course");
  }

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

  const existingEnrollment = await Enrollment.findOne({ userId, courseId });
  if (existingEnrollment) {
    throw new ApiError(400, "You are already enrolled in this course");
  }

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

    const existingEnrollment = await Enrollment.findOne({ userId, courseId }).session(session);
    if (existingEnrollment) {
      await session.commitTransaction();
      session.endSession();
      return {
        success: true,
        message: "You are already enrolled in this course",
        alreadyEnrolled: true
      };
    }

    const costInCredits = course.courseType === "credit" && course.creditCost 
      ? course.creditCost 
      : Math.ceil((course.price || 0) / CREDIT_VALUE);

    if (user.userCreditBalance < costInCredits) {
      throw new ApiError(400, "Insufficient credits");
    }

    user.userCreditBalance -= costInCredits;
    await user.save({ session });

    // 1. Create Enrollment early to get its ID for linking
    const totalContents = course.contentModules?.length || 0;
    const enrollment = new Enrollment({
      userId,
      courseId,
      status: "active",
      totalContents,
      progress: 0,
      courseSnapshot: {
        title: course.title,
        thumbnail: course.thumbnailUrl || "",
        price: course.price || 0,
        courseType: course.courseType,
        creditCost: course.creditCost || 0
      }
    });
    await enrollment.save({ session });

    // 2. Calculate Commission and Credit the Tutor (95%)
    const commissionCredits = Math.floor(costInCredits * COURSE_ENROLLMENT_COMMISSION);
    const tutorCredits = costInCredits - commissionCredits;

    const tutor = await User.findById(course.tutorId).session(session);
    if (!tutor) throw new ApiError(404, "Tutor not found");

    tutor.userCreditBalance = (tutor.userCreditBalance || 0) + tutorCredits;
    if (tutor.tutorProfile) {
      tutor.tutorProfile.totalCreditsEarned = (tutor.tutorProfile.totalCreditsEarned || 0) + tutorCredits;
      tutor.tutorProfile.earningsTotal = (tutor.tutorProfile.earningsTotal || 0) + (tutorCredits * CREDIT_VALUE);
    }
    await tutor.save({ session });

    // 3. Create Transactions linked to enrollment
    const razorpayOrderId = `wallet_${Date.now()}`;
    
    // Create student debit transaction
    await Transaction.create([{
      userId: new mongoose.Types.ObjectId(userId),
      amount: costInCredits,
      method: "wallet",
      creditBalance: user.userCreditBalance,
      currency: course.price || 0,
      status: "completed",
      type: "course_purchase",
      razorpayOrderId,
      relatedId: enrollment._id,
      platformCommission: commissionCredits // Store commission here
    }], { session });

    // Create tutor credit transaction (95%)
    await Transaction.create([{
      userId: tutor._id,
      amount: tutorCredits,
      method: "wallet",
      status: "completed",
      type: "tutor_earning",
      razorpayOrderId,
      relatedId: enrollment._id,
      creditBalance: tutor.userCreditBalance,
      currency: tutorCredits * CREDIT_VALUE
    }], { session });

    // 4. Update User and Course
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { enrolledCourses: enrollment._id } },
      { session }
    );
    
    course.totalEnrollments = (course.totalEnrollments || 0) + 1;
    await course.save({ session });

    await session.commitTransaction();
    session.endSession();

    await createNotification({
    userId: tutor._id,
    title: "New Enrollment",
    message: `${user.name} enrolled in "${course.title}"`,
    type: "SUCCESS",
  });

    return {
      success: true,
      message: "Course purchased with credits"
    };
  } catch (error: any) {
    console.error("PURCHASE_WITH_CREDITS_ERROR:", error);
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

    const existingEnrollment = await Enrollment.findOne({ userId, courseId }).session(session);
    if (existingEnrollment) {
      await session.commitTransaction();
      session.endSession();
      return {
        success: true,
        message: "Already enrolled in this course",
        alreadyEnrolled: true
      };
    }

    // 1. Calculate total credits and apply 5% commission
    const cashCredits = Math.ceil((payment.amount || 0) / CREDIT_VALUE);
    const totalCreditsForPurchase = (creditsUsed || 0) + cashCredits;

    const commissionCredits = Math.floor(totalCreditsForPurchase * 0.05);
    const tutorCredits = totalCreditsForPurchase - commissionCredits;

    // 2. Create Enrollment early to get ID
    const totalContents = course.contentModules?.length || 0;
    const enrollment = await Enrollment.create([{
      userId,
      courseId,
      status: "active",
      totalContents,
      progress: 0,
      courseSnapshot: {
        title: course.title,
        thumbnail: course.thumbnailUrl,
        price: course.price,
        courseType: course.courseType,
        creditCost: course.creditCost
      }
    }], { session });

    const enrollmentId = enrollment[0]._id;

    // 3. Create Student Transaction (Required even if 0 credits used for commission storage)
    await Transaction.create([{
      userId,
      amount: creditsUsed,
      method: "wallet",
      status: "completed",
      type: "course_purchase",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      relatedId: enrollmentId,
      creditBalance: user.userCreditBalance,
      currency: 0, // Credits portion
      platformCommission: commissionCredits * CREDIT_VALUE // Store commission here
    }], { session });

    if (creditsUsed > 0) {
      if (user.userCreditBalance < creditsUsed) {
        throw new ApiError(400, "Insufficient credits to cover the used amount");
      }
      user.userCreditBalance -= creditsUsed;
      await user.save({ session });
    }

    // 4. Credit the Tutor (95% of total credits)
    const tutor = await User.findById(course.tutorId).session(session);
    if (!tutor) throw new ApiError(404, "Tutor not found");

    tutor.userCreditBalance = (tutor.userCreditBalance || 0) + tutorCredits;
    if (tutor.tutorProfile) {
      tutor.tutorProfile.totalCreditsEarned = (tutor.tutorProfile.totalCreditsEarned || 0) + tutorCredits;
      tutor.tutorProfile.earningsTotal = (tutor.tutorProfile.earningsTotal || 0) + (tutorCredits * CREDIT_VALUE);
    }
    await tutor.save({ session });

    // Tutor Credit Transaction (95%)
    await Transaction.create([{
      userId: tutor._id,
      amount: tutorCredits,
      method: "wallet",
      status: "completed",
      type: "tutor_earning",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id || "",
      relatedId: enrollmentId,
      creditBalance: tutor.userCreditBalance,
      currency: tutorCredits * CREDIT_VALUE
    }], { session });

    // 5. Update User and Course

    // Add enrollment ID to user's enrolledCourses for fast access
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { enrolledCourses: enrollment[0]._id } },
      { session }
    );
    
    course.totalEnrollments = (course.totalEnrollments || 0) + 1;
    await course.save({ session });

    await session.commitTransaction();
    session.endSession();

  await createNotification({
    userId: tutor._id,
    title: "New Enrollment",
    message: `${user.name} enrolled in "${course.title}"`,
    type: "SUCCESS",
  });
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
