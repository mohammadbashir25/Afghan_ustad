import mongoose, { Schema, models } from "mongoose";

const operationsTaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", maxlength: 3000 },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    assignedRole: {
      type: String,
      enum: ["OPERATIONS_MANAGER", "MANAGER", "GUIDE", "TEACHER", "STAFF"],
      default: "OPERATIONS_MANAGER",
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
      index: true,
    },
    dueDate: { type: Date, default: null, index: true },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    completionNote: { type: String, default: "", maxlength: 2000 },
    completedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    completedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

operationsTaskSchema.index({ assignedRole: 1, assignedTo: 1, status: 1, dueDate: 1 });

const OperationsTask =
  models.OperationsTask || mongoose.model("OperationsTask", operationsTaskSchema);

export default OperationsTask;
