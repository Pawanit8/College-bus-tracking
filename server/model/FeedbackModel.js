import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-delete feedback after 30 days (Ensure `createdAt` is not updated)
feedbackSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const FeedbackModel = mongoose.model("Feedback", feedbackSchema);
export default FeedbackModel;
