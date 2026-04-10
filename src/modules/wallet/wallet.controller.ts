import { NextFunction, Response, Request } from "express";
import { razorpayCreditOrder, verifyPayment, verifyUpiService, walletSummary, withdrawalService } from "./wallet.service";
import { QuerySchema } from "./wallet.validation";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { User } from "../users/user.model";



export const getWalletSummary = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const result = QuerySchema.safeParse(req.query);
    
    if (!result.success) {
      const message = result.error.issues
        .map((issue, i) => {
          return String(issue.path[i]) + " ---> " + issue.message
        })
        .join(' | ');

      throw new ApiError(400, message);
    }

    const wallet = await walletSummary(result.data,req.user?._id);

    res.status(200).json(
      new ApiResponse("User wallet history",wallet,true)
    );

  }catch(error){
    next(error);
  }
}

export const createCreditOrder = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const { amount } = req.body ;
    if(!amount || amount < 0)throw new ApiError(400,"Enter a valid amount!");

    if (['tutor', 'premiumTutor'].includes(req.user?.role)) {
      throw new ApiError(403, "Tutors are not allowed to purchase credits directly.");
    }

    const order:any = await razorpayCreditOrder(amount,req.user?._id);

    res.status(201).json(
      new ApiResponse("Credit Order created!", order, true)
    );

  }catch(error){
    next(error);
  }
}

export const verifyCreditPayment = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{

    await verifyPayment(req.body, req.user?._id);

    res.status(200).json(
      new ApiResponse("Payment verified",null,true)
    );
    
  }catch(error){
    next(error);
  }
}

export const verifyUpiController = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const {upi} = req.body ;

    const isVerified = await verifyUpiService(upi,req.user._id);

    if(!isVerified.success){
      throw new ApiError(400,isVerified.message);
    }

    res.status(200).json(
      new ApiResponse("User UPI ID updated!",{name : isVerified.name , upi },true)
    );

  }catch(error){
    next(error);
  }
}

export const withdrawalController = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
  try{
    const amount = req.body.amount ;

    const data = await withdrawalService(amount,req.user._id);

    res.status(201).json(
      new ApiResponse("Credits withdrawal success!",data,true)
    );
  }catch(error){
    next(error);
  }
}