import mongoose, { Schema, models } from "mongoose";

const paymentSchema = new Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    class: { type: Schema.Types.ObjectId, ref: "ClassRecord", default: null, index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", default: null, index: true },
    discountAmount: { type: Number, min: 0, default: 0 },
    studentName: { type: String, trim: true, default: "" },
    studentId: { type: String, trim: true, default: "" },
    courseName: { type: String, required: true, trim: true },
    courseFee: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0 },
    balanceAfterPayment: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["CASH", "BANK", "MOBILE_MONEY", "OTHER"],
      required: true,
    },
    paidAt: { type: Date, required: true, default: Date.now },
    receivedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const Payment = models.Payment || mongoose.model("Payment", paymentSchema);
export default Payment;
