import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: function (this: { role?: string }) { return this.role !== "STUDENT"; },
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    fatherName: { type: String, trim: true, maxlength: 120, default: "" },
    whatsappNumber: { type: String, trim: true, maxlength: 32, index: true, default: "" },
    photoUrl: { type: String, trim: true, maxlength: 1000, default: "" },

    password: {
      type: String,
      required: function (this: { role?: string }) {
        return this.role !== "STUDENT";
      },
      select: false,
    },

    studentId: { type: String, unique: true, sparse: true, trim: true },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    pinHash: { type: String, select: false },

    course: { type: Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    class: { type: Schema.Types.ObjectId, ref: "ClassRecord", default: null, index: true },
    courseName: { type: String, trim: true },
    courseFee: { type: Number, min: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    salaryAmount: { type: Number, min: 0, default: 0 },

    role: {
      type: String,
      enum: ["SUPER_ADMIN", "MANAGER", "GUIDE", "TEACHER", "STAFF", "STUDENT"],
      required: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const User = models.User || mongoose.model("User", userSchema);
export default User;
