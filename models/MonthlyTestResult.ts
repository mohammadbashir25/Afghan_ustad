import mongoose, { Schema, models } from "mongoose";
const monthlyTestResultSchema = new Schema({
  test: { type: Schema.Types.ObjectId, ref: "MonthlyTest", required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  practicalScore: { type: Number, required: true, min: 0, max: 100 },
  testScore: { type: Number, required: true, min: 0, max: 100 },
  finalScore: { type: Number, required: true, min: 0, max: 100 },
  practicalEvidence: { type: String, default: "", maxlength: 1000 },
  feedback: { type: String, default: "", maxlength: 2000 },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });
monthlyTestResultSchema.index({ test: 1, student: 1 }, { unique: true });
const MonthlyTestResult = models.MonthlyTestResult || mongoose.model("MonthlyTestResult", monthlyTestResultSchema);
export default MonthlyTestResult;
