import mongoose, { Schema, models } from "mongoose";
const performanceSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  class: { type: Schema.Types.ObjectId, ref: "ClassRecord", default: null },
  assignment: { type: Schema.Types.ObjectId, ref: "Assignment", default: null, index: true },
  assessment: { type: String, required: true, trim: true, maxlength: 160 },
  score: { type: Number, required: true, min: 0 },
  maxScore: { type: Number, required: true, min: 1 },
  date: { type: Date, required: true, default: Date.now, index: true },
  notes: { type: String, default: "", maxlength: 1000 },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
performanceSchema.pre("validate", function () {
  if (this.score > this.maxScore) this.invalidate("score", "Score cannot exceed the maximum score.");
});
const Performance = models.Performance || mongoose.model("Performance", performanceSchema);
export default Performance;
