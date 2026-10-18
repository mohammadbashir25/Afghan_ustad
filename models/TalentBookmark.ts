import mongoose, { Schema, models } from "mongoose";
const talentBookmarkSchema = new Schema({ student: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true }, bookmarkedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, note: { type: String, default: "", maxlength: 1000 } }, { timestamps: true });
const TalentBookmark = models.TalentBookmark || mongoose.model("TalentBookmark", talentBookmarkSchema);
export default TalentBookmark;
