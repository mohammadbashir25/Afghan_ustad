import mongoose, { Schema, models } from "mongoose";

const loginAttemptSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  count: { type: Number, required: true, default: 0 },
  windowStartedAt: { type: Date, required: true, default: Date.now },
  lockedUntil: { type: Date, default: null },
  expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true });
loginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const LoginAttempt = models.LoginAttempt || mongoose.model("LoginAttempt", loginAttemptSchema);
export default LoginAttempt;
