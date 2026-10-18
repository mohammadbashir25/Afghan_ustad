import mongoose, { Schema, models } from "mongoose";
const attendanceSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  class: { type: Schema.Types.ObjectId, ref: "ClassRecord", required: true, index: true },
  date: { type: Date, required: true, index: true },
  status: { type: String, enum: ["PRESENT", "ABSENT", "LATE", "EXCUSED"], required: true },
  notes: { type: String, default: "", maxlength: 500 },
  markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
attendanceSchema.index({ student: 1, class: 1, date: 1 }, { unique: true });
const Attendance = models.Attendance || mongoose.model("Attendance", attendanceSchema);
export default Attendance;
