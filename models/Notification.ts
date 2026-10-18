import mongoose, { Schema, models } from "mongoose";
const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  kind: { type: String, enum: ["ANNOUNCEMENT", "SYSTEM", "FINANCE", "ACADEMIC"], default: "ANNOUNCEMENT", index: true },
  sourceId: { type: String, default: "" },
  readAt: { type: Date, default: null, index: true },
}, { timestamps: true });
notificationSchema.index({ recipient: 1, createdAt: -1 });
const Notification = models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;
