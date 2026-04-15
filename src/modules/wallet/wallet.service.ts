import { Types } from "mongoose"
import { User } from "../users/user.model"
import { ApiError } from "../../utils/ApiError";
import { CREDIT_PURCHASE_COMMISSION, CREDIT_VALUE, CREDIT_WITHDRAW_COMMISSION, CREDIT_WITHDRAW_LIMIT , CREDIT_WITHDRAW_MAX_LIMIT, CREDIT_WITHDRAW_MIN_LIMIT} from "./wallet.constant";
import { IQuery } from "./wallet.validation";
import { Transaction } from "./wallet.model";
import { razorpay } from "../../config/razorpay";
import crypto from 'crypto'
import { env } from "../../config/env";
import { Enrollment } from "../enrollments/enrollment.model";
import { createNotification } from "../notifications/notification.service";
import { sendEmail } from "../../services/brevo.service";

export const walletSummary = async (query: IQuery, userId: Types.ObjectId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found!"); 
  const isTutor = user.role === "tutor" || user.role === "premiumTutor";
  if (query.refresh) {
    if(isTutor){
       return {
      creditBalance: user?.tutorProfile?.totalCreditsEarned ?? 0,
      creditValue: (user?.tutorProfile?.totalCreditsEarned ?? 0) * CREDIT_VALUE,
      creditConst: CREDIT_VALUE,
      creditPurchaseCommision : CREDIT_PURCHASE_COMMISSION,
      creditWithdrawMinLimit : CREDIT_WITHDRAW_MIN_LIMIT ,
      creditWithdrawMaxLimit : CREDIT_WITHDRAW_MAX_LIMIT , 
      creditWithdrawCommision : CREDIT_WITHDRAW_COMMISSION,
      creditWithdrawCommisionLimit : CREDIT_WITHDRAW_LIMIT
    }
    }
    return {
      creditBalance: user.userCreditBalance,
      creditValue: user.userCreditBalance * CREDIT_VALUE,
      creditConst: CREDIT_VALUE,
      creditPurchaseCommision : CREDIT_PURCHASE_COMMISSION,
      creditWithdrawMinLimit : CREDIT_WITHDRAW_MIN_LIMIT ,
      creditWithdrawMaxLimit : CREDIT_WITHDRAW_MAX_LIMIT , 
      creditWithdrawCommision : CREDIT_WITHDRAW_COMMISSION,
      creditWithdrawCommisionLimit : CREDIT_WITHDRAW_LIMIT
    }
  }

  // --- Logic for Full History ---

   const transactionQuery: any = { userId };
    if (query.status) {
    transactionQuery.status = query.status;
  } else {
    transactionQuery.status = { $ne: "initialized" };
  }
   if (isTutor) {
    // If Tutor: Show only earnings from teaching and withdrawals
    transactionQuery.type = { $in: ["tutor_earning", "credit_withdraw"] };
  } 

  // Else (Student/Admin): Show all history (purchases, spending, AND any earnings)
  const transactions = await Transaction.find(transactionQuery)
    .limit(query.limit || 10)
    .sort({ createdAt: -1 });

  const transactionsCount = await Transaction.countDocuments(transactionQuery);


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
  const finalBalance = isTutor 
    ? (user?.tutorProfile?.totalCreditsEarned ?? 0) 
    : user.userCreditBalance;

  return {
    creditBalance: finalBalance,
    creditValue: finalBalance * CREDIT_VALUE,
    transactions: enrichedTransactions,
    totalTransactions : transactionsCount,
    creditConst: CREDIT_VALUE,
    creditPurchaseCommision : CREDIT_PURCHASE_COMMISSION,
    creditWithdrawMinLimit : CREDIT_WITHDRAW_MIN_LIMIT ,
    creditWithdrawMaxLimit : CREDIT_WITHDRAW_MAX_LIMIT , 
    creditWithdrawCommision : CREDIT_WITHDRAW_COMMISSION,
    creditWithdrawCommisionLimit : CREDIT_WITHDRAW_LIMIT
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

    await createNotification({
      userId: userId as any,
      title: "Credits Added",
      message: `Successfully added ${transaction.amount} credits to your wallet.`,
      type: "SUCCESS",
    });

    await sendEmail(user.email, 2, { name: user.name, subject: `Successfully added ${transaction.amount} credits to your wallet. Your new balance is ${user.userCreditBalance} credits.` }, 'Credits Added');

  }else {
    throw new ApiError(403,"Invalid signature");
  }

  return true ;
}

export const verifyUpiService = async  (upiId:string,userId:string) => {

  const regex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

  if (!upiId) {
    return { success: false, message: "UPI ID is required" };
  }

  if (!regex.test(upiId)) {
    return { success: false, message: "Invalid UPI format" };
  }

  const user = await User.findOneAndUpdate({_id : userId},{userUpiId : upiId});
  if(!user)return {success : false, message : "User not found!"}

  return { success: true, message: "Valid UPI format", name : user.name };
}

export const withdrawalService = async (amount:number, userId:string) => {
  
  const user = await User.findById(userId).select("userCreditBalance name email");
  if(!user)throw new ApiError(404,"user not found!");

  if(amount > user.userCreditBalance){
    throw new ApiError(400,"Insufficient balance!");
  }

  let withdrawAmount = 0 ;
  let platformCommission = 0 ;

  if(amount > CREDIT_WITHDRAW_LIMIT){
    platformCommission = amount * CREDIT_WITHDRAW_COMMISSION ;
    withdrawAmount = amount - platformCommission ;
  }else{
    withdrawAmount = amount ;
  }

  console.log(user.userCreditBalance)

  user.userCreditBalance -= withdrawAmount ;
  await user.save();

  console.log(user.userCreditBalance)

  const transaction = await Transaction.create({
    userId : user._id,
    amount : withdrawAmount,
    currency : withdrawAmount * CREDIT_VALUE,
    creditBalance : user.userCreditBalance,
    type : 'credit_withdraw',
    method : "wallet",
    status : "pending",
    platformCommission : platformCommission ?? 0
  });

  await sendEmail(user.email, 2, { name: user.name, subject: `Your withdrawal request for ${withdrawAmount} credits has been received and is currently pending. We will notify you once it's processed.` }, 'Withdrawal Requested');

  return transaction;

}