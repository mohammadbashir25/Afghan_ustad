import mongoose, { Schema, models } from "mongoose";
const enrollmentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: "ClassRecord",
      default: null,
      index: true,
    },
    courseName: { type: String, required: true, trim: true },
    courseFee: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    enrolledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "ACTIVE", "COMPLETED", "CANCELLED"],
      default: "PENDING_PAYMENT",
      index: true,
    },
  },
  { timestamps: true },
);
enrollmentSchema.index({ student: 1, course: 1, class: 1 }, { unique: true });
const Enrollment =
  models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;
