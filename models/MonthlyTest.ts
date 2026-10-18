import mongoose, { Schema, models } from "mongoose";
const monthlyTestSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    class: {
      type: Schema.Types.ObjectId,
      ref: "ClassRecord",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2020, max: 2200 },
    testDate: { type: Date, required: true },
    maxScore: { type: Number, required: true, min: 1, default: 100 },
    instructions: { type: String, default: "", maxlength: 3000 },
    questions: [
      {
        prompt: { type: String, required: true, trim: true, maxlength: 1500 },
        type: {
          type: String,
          enum: ["MULTIPLE_CHOICE", "PRACTICAL", "PROJECT_UPLOAD"],
          required: true,
        },
        options: [{ type: String, trim: true, maxlength: 300 }],
        correctOption: { type: Number, min: 0, max: 3 },
        points: { type: Number, min: 1, max: 100, required: true },
      },
    ],
    practicalTasks: [
      {
        title: { type: String, required: true, trim: true, maxlength: 160 },
        instructions: {
          type: String,
          required: true,
          trim: true,
          maxlength: 2000,
        },
        points: { type: Number, min: 1, max: 100, required: true },
        requiresUpload: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ["PLANNED", "OPEN", "COMPLETED"],
      default: "PLANNED",
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);
monthlyTestSchema.index({ class: 1, month: 1, year: 1 }, { unique: true });
const MonthlyTest =
  models.MonthlyTest || mongoose.model("MonthlyTest", monthlyTestSchema);
export default MonthlyTest;
