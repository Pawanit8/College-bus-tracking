import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  title: String,
  content: String,
  sentBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ✅ Track who read it
});




const Message = mongoose.model("Message", MessageSchema);

export default Message;
