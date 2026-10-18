import mongoose, { Schema, models } from "mongoose";
const expenseSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, trim: true, lowercase: true, maxlength: 80, index: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now, index: true },
  note: { type: String, default: "", maxlength: 1000 },
  receiptUrl: { type: String, default: "", maxlength: 1000 },
  policy: { type: Schema.Types.ObjectId, ref: "ExpensePolicy", default: null },
  status: { type: String, enum: ["RECORDED", "PENDING_APPROVAL", "APPROVED", "REJECTED"], default: "RECORDED", index: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  reviewNote: { type: String, default: "", maxlength: 1000 },
}, { timestamps: true });
const Expense = models.Expense || mongoose.model("Expense", expenseSchema);
export default Expense;
