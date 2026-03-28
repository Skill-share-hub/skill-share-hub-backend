
const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const transactionSchema = new Schema({
  userId : {
    type : Schema.Types.ObjectId,
    required : true
  },
  amount : {
    type : Number,
    required : true
  },
  currency : {
    type : Number,
    required : true
  },
  creditBalance : {
    type : Number,
    required : true
  },
  type : {
    type : String,
    enum : ["credit_purchase" , "credit_withdraw" , "course_purchase", "tutor_earning", "platform_commission"],
    required : true
  },
  relatedId : {
    type : Schema.Types.ObjectId,
    required : false
  },
  method : {
    type : String,
    enum : ["razor_pay" , "wallet"],
    required : true
  },
  status : {
    type : String,
    enum : ["completed" , "pending" , "initialized" , "rejected"],
    required : true
  },
  razorpayOrderId: {
    type : String,
    required : true
  },
  razorpayPaymentId: String
},{timestamps : true});

// Avoid model recompilation if it exists
const Transaction = mongoose.models.Transaction || model("Transaction", transactionSchema);

async function testCommissionType() {
  const platformId = new Types.ObjectId("660000000000000000000000");
  
  const tx = new Transaction({
    userId: platformId,
    amount: 5, // 5% of 100
    method: "wallet",
    creditBalance: 0,
    currency: 25, // 5 credits * 5 INR
    status: "completed",
    type: "platform_commission", // THE NEW TYPE
    razorpayOrderId: "wallet_test_123",
    relatedId: new Types.ObjectId()
  });

  try {
    await tx.validate();
    console.log("✅ Validation successful: 'platform_commission' type is accepted.");
  } catch (err) {
    console.error("❌ Validation failed:", err.message);
    process.exit(1);
  }
}

testCommissionType();
