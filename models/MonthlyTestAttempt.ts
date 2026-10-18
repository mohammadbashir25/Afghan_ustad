import mongoose, { Schema, models } from "mongoose";
const attemptSchema = new Schema(
  {
    test: {
      type: Schema.Types.ObjectId,
      ref: "MonthlyTest",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    answers: [
      {
        questionIndex: { type: Number, required: true },
        answer: { type: String, default: "", maxlength: 5000 },
      },
    ],
    autoScore: { type: Number, min: 0, max: 100, default: 0 },
    autoGradedPoints: { type: Number, min: 0, default: 0 },
    pendingManualPoints: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["SUBMITTED", "REVIEWED"],
      default: "SUBMITTED",
      index: true,
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
attemptSchema.index({ test: 1, student: 1 }, { unique: true });
const MonthlyTestAttempt =
  models.MonthlyTestAttempt ||
  mongoose.model("MonthlyTestAttempt", attemptSchema);
export default MonthlyTestAttempt;
