
import mongoose from 'mongoose';
import { Transaction } from '../src/modules/wallet/wallet.model';
import { CREDIT_VALUE } from '../src/modules/wallet/wallet.constant';
import dotenv from 'dotenv';

dotenv.config();

async function verify() {
  try {
    // await mongoose.connect(process.env.MONGO_URI!);
    console.log("Skipping DB connection, testing schema validation only");

    const testEnrollmentId = new mongoose.Types.ObjectId();
    const testUserId = new mongoose.Types.ObjectId();

    // 1. Test Schema Validation
    const testTx = new Transaction({
      userId: testUserId,
      amount: 100,
      method: "wallet",
      creditBalance: 500,
      currency: 1000,
      status: "completed",
      type: "course_purchase",
      razorpayOrderId: "test_order_" + Date.now(),
      relatedId: testEnrollmentId,
      platformCommission: 5 // 5% commission
    });

    await testTx.validate();
    console.log("✅ Schema validation passed for platformCommission field");

    // 2. Test Aggregation Logic (Simulated manually since no DB)
    const CREDIT_VALUE_TEST = CREDIT_VALUE || 10;
    
    const transactionsMock: Array<{ 
        type: string; 
        amount?: number; 
        currency?: number; 
        status: string; 
        platformCommission?: number 
    }> = [
        { type: "platform_commission", amount: 10, currency: 10 * CREDIT_VALUE_TEST, status: "completed" },
        { type: "course_purchase", amount: 200, platformCommission: 15, status: "completed" }
    ];

    const results = transactionsMock.reduce((acc, tx) => {
        if (tx.status !== "completed") return acc;
        
        let comm = 0;
        let rev = 0;

        if (tx.type === "platform_commission") {
            comm = tx.amount ?? 0;
            rev = tx.currency ?? 0;
        } else if (tx.platformCommission! > 0) {
            comm = tx.platformCommission!;
            rev = tx.platformCommission! * CREDIT_VALUE_TEST;
        }

        acc.totalCredits += comm || 0;
        acc.totalRevenue += rev || 0;
        return acc;
    }, { totalCredits: 0, totalRevenue: 0 });

    console.log("Simulated aggregation result:", results);

    const expectedCredits = 25;
    const expectedRevenue = 25 * CREDIT_VALUE_TEST;

    if (results.totalCredits === expectedCredits && results.totalRevenue === expectedRevenue) {
        console.log("✅ Simulation logic verified successfully!");
    } else {
        console.error(`❌ Simulation logic failed.`);
    }

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    // await mongoose.disconnect();
  }
}

verify();
