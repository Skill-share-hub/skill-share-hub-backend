import { Request, Response, NextFunction } from "express";
import * as paymentService from "../services/payment.service";
import { ApiResponse } from "../../../utils/ApiResponse";

export const getPurchaseSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    const { courseId } = req.params;
    const { paymentMethod } = req.body;

    const summary = await paymentService.getPurchaseSummary(courseId as string, userId.toString(), paymentMethod);

    return res.status(200).json(
      new ApiResponse("Purchase summary fetched successfully", summary)
    );
  } catch (error) {
    next(error);
  }
};

export const createRazorpayOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    const { courseId } = req.body;

    const order = await paymentService.createRazorpayOrder(courseId, userId.toString());

    // Send the specific response requested by standard integration
    return res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const purchaseWithCredits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    const { courseId } = req.params;

    const result = await paymentService.purchaseWithCredits(courseId as string, userId.toString());

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    
    const result = await paymentService.verifyRazorpayPayment(req.body, userId.toString());

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
