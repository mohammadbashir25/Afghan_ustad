import mongoose, { Schema, models } from "mongoose";
const submissionSchema = new Schema({ assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true }, student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, text: { type: String, default: "", maxlength: 5000 }, attachmentUrl: { type: String, default: "" }, submittedAt: { type: Date, default: Date.now }, status: { type: String, enum: ["SUBMITTED", "REVIEWED", "RESUBMIT"], default: "SUBMITTED" }, score: { type: Number, min: 0, default: null }, feedback: { type: String, default: "", maxlength: 2000 }, reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null } }, { timestamps: true });
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
const AssignmentSubmission = models.AssignmentSubmission || mongoose.model("AssignmentSubmission", submissionSchema);
export default AssignmentSubmission;
