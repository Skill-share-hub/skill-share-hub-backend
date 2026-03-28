import { Types } from "mongoose"
import { User } from "../users/user.model"
import { ApiError } from "../../utils/ApiError";
import { CREDIT_PURCHASE_COMMISSION, CREDIT_VALUE } from "./wallet.constant";
import { IQuery } from "./wallet.validation";
import { Transaction } from "./wallet.model";
import { razorpay } from "../../config/razorpay";
import crypto from 'crypto'
import { env } from "../../config/env";



import { Enrollment } from "../enrollments/enrollment.model";

export const walletSummary = async (query: IQuery, userId: Types.ObjectId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found!");

  if (query.refresh) {
    return {
      creditBalance: user.userCreditBalance,
      creditValue: user.userCreditBalance * CREDIT_VALUE,
      creditConst: CREDIT_VALUE
    }
  }

  const status = query.status || { $ne: "initialized" };

  const transactions = await Transaction.find({ userId, status })
    .limit(query.limit)
    .sort({ createdAt: -1 });

  const enrollments = await Enrollment.find({ userId });

  const enrichedTransactions = transactions.map((tx: any) => {
    const match = enrollments.find(
      (en) =>
        Math.abs(new Date(en.createdAt).getTime() - new Date(tx.createdAt).getTime()) < 10000
    );

    return {
      ...tx._doc,
      courseId: match?.courseId || null,
      courseSnapshot: match?.courseSnapshot || null
    };
  });

  return {
    creditBalance: user.userCreditBalance,
    creditValue: user.userCreditBalance * CREDIT_VALUE,
    transactions: enrichedTransactions,
    creditConst: CREDIT_VALUE
  }
}


export const razorpayCreditOrder = async (credits:number, userId:Types.ObjectId) => {

    const realMoney = credits * CREDIT_VALUE ;

    const options = {
      amount: realMoney * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now()
    }

    const order = await razorpay.orders.create(options);
    const user = await User.findById(userId).select("userCreditBalance").lean();
    if(!user)throw new ApiError(404,"User not found!");

    const platformCommission = Math.round(credits * CREDIT_PURCHASE_COMMISSION);
    const creditsAfterCommission = credits - platformCommission

    await Transaction.create({
      userId,
      amount : creditsAfterCommission,
      method : "razor_pay",
      razorpayOrderId : order.id,
      status : "initialized",
      type : "credit_purchase",
      creditBalance : user.userCreditBalance  ,
      currency : realMoney,
      platformCommission : platformCommission * CREDIT_VALUE
    });

    return order ;
}

export const verifyPayment = async (payload:any, userId:Types.ObjectId) => {

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = payload

  const body = razorpay_order_id + "|" + razorpay_payment_id

  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(body.toString())
    .digest("hex")

  if (expectedSignature === razorpay_signature){

    const transaction = await Transaction.findOne({razorpayOrderId : razorpay_order_id, userId});
    if(!transaction)throw new ApiError(404,"payment verified transaction failed!");

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.amount !== transaction.currency * 100) throw new ApiError(403, "Amount mismatch!");

    transaction.razorpayPaymentId = razorpay_payment_id ;
    transaction.status = "completed" ;

    await transaction.save();

    const user = await User.findOneAndUpdate(
      {_id : userId},
      {
        $inc : {userCreditBalance : transaction.amount},
        $push : {userTransactions : transaction._id}
      },
      {runValidators : true , returnDocument: 'after'}

    );

    if(!user)throw new ApiError(404,"User Not found!");

  }else {
    throw new ApiError(403,"Invalid signature");
  }

  return true ;
}