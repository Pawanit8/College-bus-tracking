import mongoose from "mongoose";
const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null for global notifications
    message: { type: String, required: true },
    type: { type: String, enum: ['delay', 'route-change', 'general'], default: 'general' },
    createdAt: { type: Date, default: Date.now }
  }, { timestamps: true });
  
 const NotificationModel= mongoose.model('Notification', NotificationSchema);
  export default NotificationModel