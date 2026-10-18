import mongoose, { Schema, models } from "mongoose";
const auditLogSchema = new Schema({ actor: { type: Schema.Types.ObjectId, ref: "User", default: null }, actorName: { type: String, default: "System" }, action: { type: String, required: true, index: true }, targetType: { type: String, required: true }, targetId: { type: String, default: "" }, details: { type: String, default: "", maxlength: 1000 } }, { timestamps: true });
const AuditLog = models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
