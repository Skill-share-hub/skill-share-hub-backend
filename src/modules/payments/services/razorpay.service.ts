import { razorpay } from "../../../config/razorpay";

export const razorpayService = {
  createOrder: async (options: { amount: number; currency: string; receipt: string }) => {
    return razorpay.orders.create(options);
  }
};
