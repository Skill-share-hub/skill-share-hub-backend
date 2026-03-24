import { Types } from "mongoose"
import { User } from "../users/user.model"
import { ApiError } from "../../utils/ApiError";
import { CREDIT_VALUE } from "./wallet.constant";
import { IQuery } from "./wallet.validation";
import { Transaction } from "./wallet.model";
import { razorpay } from "../../config/razorpay";
import crypto from 'crypto'
import { env } from "../../config/env";



export const walletSummary = async (query:IQuery,userId:Types.ObjectId) => {
  const user = await User.findById(userId);
  if(!user)throw new ApiError(404,"User not found!");

  if(query.refresh){    
    return {
      creditBalance : user.userCreditBalance,
      creditValue : user.userCreditBalance * CREDIT_VALUE,
      creditConst : CREDIT_VALUE
    }
  }

  const status = query.status || {$ne : "initialized"};

  const transactions = await Transaction.find({userId, status})
  .limit(query.limit)
  .sort({createdAt : -1});

  return {
    creditBalance : user.userCreditBalance,
    creditValue : user.userCreditBalance * CREDIT_VALUE,
    transactions,
    creditConst : CREDIT_VALUE
  }
}

export const razorpayCreditOrder = async (credits:number, userId:Types.ObjectId) => {

    const amount = credits * CREDIT_VALUE ;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now()
    }

    const order = await razorpay.orders.create(options);
    const user = await User.findById(userId).select("userCreditBalance").lean();
    if(!user)throw new ApiError(404,"User not found!")

    await Transaction.create({
      userId,
      amount : credits,
      method : "razor_pay",
      razorpayOrderId : order.id,
      status : "initialized",
      type : "credit_purchase",
      creditBalance : user.userCreditBalance  ,
      currency : amount
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

    const transaction = await Transaction.findOneAndUpdate(
      
      {razorpayOrderId : razorpay_order_id, userId},
      {
        razorpayPaymentId : razorpay_payment_id,
        status : "completed"
      },
      {runValidators : true , returnDocument: 'after'}

    );

    if(!transaction)throw new ApiError(404,"payment verified transaction failed!");

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