import mongoose, { Schema, models } from "mongoose";
const classSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    guide: { type: Schema.Types.ObjectId, ref: "User", default: null },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    schedule: { type: String, required: true, trim: true, maxlength: 160 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["ACTIVE", "UPCOMING", "COMPLETED"],
      default: "UPCOMING",
      index: true,
    },
  },
  { timestamps: true },
);
const ClassRecord =
  models.ClassRecord || mongoose.model("ClassRecord", classSchema, "classes");
export default ClassRecord;
