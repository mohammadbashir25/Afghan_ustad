import mongoose, { Schema, models } from "mongoose";

/** Posted fine/gift entries are an auditable staff account ledger. Positive net = credit; negative net = deduction. */
const staffAdjustmentSchema = new Schema({
  staff: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["FINE", "GIFT"], required: true, index: true },
  amount: { type: Number, required: true, min: 0.01 },
  reason: { type: String, required: true, trim: true, maxlength: 1000 },
  effectiveAt: { type: Date, required: true, default: Date.now, index: true },
  status: { type: String, enum: ["POSTED", "VOID"], default: "POSTED", index: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recordedByName: { type: String, default: "Staff" },
}, { timestamps: true });
staffAdjustmentSchema.index({ staff: 1, effectiveAt: -1 });
const StaffAdjustment = models.StaffAdjustment || mongoose.model("StaffAdjustment", staffAdjustmentSchema);
export default StaffAdjustment;
