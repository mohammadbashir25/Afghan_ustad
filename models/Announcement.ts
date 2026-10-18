import mongoose, { Schema, models } from "mongoose";
const announcementSchema = new Schema({ title: { type: String, required: true, trim: true, maxlength: 160 }, message: { type: String, required: true, trim: true, maxlength: 3000 }, audience: { type: String, enum: ["ALL", "STUDENTS", "STAFF"], default: "ALL" }, published: { type: Boolean, default: true }, createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true } }, { timestamps: true });
const Announcement = models.Announcement || mongoose.model("Announcement", announcementSchema);
export default Announcement;
