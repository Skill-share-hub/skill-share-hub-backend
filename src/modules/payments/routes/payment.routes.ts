import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import {
  purchaseSummarySchema,
  createRazorpayOrderSchema,
  verifyPaymentSchema
} from "./../validations/payment.validation";
import {
  getPurchaseSummary,
  createRazorpayOrder,
  purchaseWithCredits,
  verifyRazorpayPayment
} from "./../controllers/payment.controller";

const router = Router();

router.post(
  "/:courseId/summary",
  authenticate,
  validate(purchaseSummarySchema),
  getPurchaseSummary
);

router.post(
  "/course/order",
  authenticate,
  validate(createRazorpayOrderSchema),
  createRazorpayOrder
);

router.post(
  "/:courseId/credits",
  authenticate,
  purchaseWithCredits
);

router.post(
  "/course/verify",
  authenticate,
  validate(verifyPaymentSchema),
  verifyRazorpayPayment
);

export default router;
