import mongoose, { Schema, models } from "mongoose";
const courseSchema = new Schema(
  {
    // English legacy fields remain for existing class, payment and dashboard queries.
    title: { type: String, required: true, trim: true, maxlength: 120 },
    titleI18n: {
      en: { type: String, required: true, trim: true, maxlength: 120 },
      fa: { type: String, required: true, trim: true, maxlength: 120 },
      ps: { type: String, required: true, trim: true, maxlength: 120 },
    },
    categoryI18n: {
      en: { type: String, required: true, trim: true, maxlength: 80 },
      fa: { type: String, required: true, trim: true, maxlength: 80 },
      ps: { type: String, required: true, trim: true, maxlength: 80 },
    },
    descriptionI18n: {
      en: { type: String, required: true, trim: true, maxlength: 3000 },
      fa: { type: String, required: true, trim: true, maxlength: 3000 },
      ps: { type: String, required: true, trim: true, maxlength: 3000 },
    },
    durationI18n: {
      en: { type: String, required: true, trim: true, maxlength: 80 },
      fa: { type: String, required: true, trim: true, maxlength: 80 },
      ps: { type: String, required: true, trim: true, maxlength: 80 },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    thumbnailUrl: { type: String, required: true, trim: true, maxlength: 1000 },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    featured: { type: Boolean, default: false },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", maxlength: 3000 },
    duration: { type: String, required: true, trim: true, maxlength: 80 },
    fee: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["ACTIVE", "DRAFT", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
  },
  { timestamps: true },
);
const Course = models.Course || mongoose.model("Course", courseSchema);
export default Course;
