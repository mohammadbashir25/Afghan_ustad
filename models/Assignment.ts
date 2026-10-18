import mongoose, { Schema, models } from "mongoose";
const assignmentSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: "", maxlength: 3000 },
  guidesAndTips: { type: String, default: "", maxlength: 3000 },
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  class: { type: Schema.Types.ObjectId, ref: "ClassRecord", default: null, index: true },
  dueDate: { type: Date, required: true, index: true },
  status: { type: String, enum: ["DRAFT", "PUBLISHED", "CLOSED"], default: "PUBLISHED", index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
const Assignment = models.Assignment || mongoose.model("Assignment", assignmentSchema);
export default Assignment;
