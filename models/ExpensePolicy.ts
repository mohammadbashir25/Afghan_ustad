import mongoose, { Schema, models } from "mongoose";
const expensePolicySchema = new Schema({
  category: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 80 },
  label: { type: String, required: true, trim: true, maxlength: 80 },
  dailyLimit: { type: Number, required: true, min: 0 },
  perExpenseLimit: { type: Number, required: true, min: 0 },
  requiresReceipt: { type: Boolean, default: false },
  active: { type: Boolean, default: true, index: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
const ExpensePolicy = models.ExpensePolicy || mongoose.model("ExpensePolicy", expensePolicySchema);
export default ExpensePolicy;
