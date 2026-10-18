import mongoose, { Schema, models } from "mongoose";
const localizedText = { en: { type: String, required: true, trim: true, maxlength: 3000 }, fa: { type: String, required: true, trim: true, maxlength: 3000 }, ps: { type: String, required: true, trim: true, maxlength: 3000 } };
const publicStorySchema = new Schema({
  type: { type: String, enum: ["SUCCESS_STORY", "TESTIMONIAL"], required: true, index: true },
  studentName: { type: String, required: true, trim: true, maxlength: 120 },
  studentNameI18n: { en: { type: String, required: true, trim: true, maxlength: 120 }, fa: { type: String, required: true, trim: true, maxlength: 120 }, ps: { type: String, required: true, trim: true, maxlength: 120 } },
  story: { type: String, required: true, trim: true, maxlength: 3000 }, storyI18n: localizedText,
  outcome: { type: String, default: "", trim: true, maxlength: 1000 }, outcomeI18n: { en: { type: String, default: "" }, fa: { type: String, default: "" }, ps: { type: String, default: "" } },
  role: { type: String, default: "", trim: true, maxlength: 120 }, roleI18n: { en: { type: String, default: "" }, fa: { type: String, default: "" }, ps: { type: String, default: "" } },
  category: { type: String, default: "", trim: true, maxlength: 120 }, categoryI18n: { en: { type: String, default: "" }, fa: { type: String, default: "" }, ps: { type: String, default: "" } },
  imageUrl: { type: String, default: "", trim: true, maxlength: 1000 }, imageAltI18n: { en: { type: String, default: "" }, fa: { type: String, default: "" }, ps: { type: String, default: "" } },
  isApproved: { type: Boolean, default: false, index: true }, featured: { type: Boolean, default: false }, consentConfirmed: { type: Boolean, required: true, default: false },
}, { timestamps: true });
const PublicStory = models.PublicStory || mongoose.model("PublicStory", publicStorySchema);
export default PublicStory;
