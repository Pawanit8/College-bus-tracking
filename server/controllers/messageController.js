import Message from "../model/MessageModel.js";

class MessageController {
  // ✅ Admin sends a message
  sendMessage = async (req, res) => {
    try {
      const { title, content } = req.body;
      const adminId = req.user.id; // Assuming admin authentication middleware

      const newMessage = new Message({ title, content, sentBy: adminId, readBy: [] });
      await newMessage.save();

      // Emit real-time update
      const io = req.app.get("io"); 
      io.emit("new-message", newMessage);

      res.status(201).json({ success: true, message: "Message sent successfully", data: newMessage });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  //delete messages using his id
  deleteMessage = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedMessage = await Message.findByIdAndDelete(id);
  
      if (!deletedMessage) {
        return res.status(404).json({ success: false, message: "Message not found" });
      }
  
      res.status(200).json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error deleting message" });
    }
  };

  // ✅ Fetch all messages
  getMessages = async (req, res) => {
    try {
      const messages = await Message.find().sort({ createdAt: -1 }).limit(5); // Show only latest 5 messages
      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching messages" });
    }
  };

  // ✅ Get count of unread messages for logged-in user
  getUnreadMessageCount = async (req, res) => {
    try {
      const userId = req.user.id;
      
      const unreadCount = await Message.countDocuments({ readBy: { $ne: userId } });

      res.status(200).json({ success: true, unreadCount });
    } catch (err) {
      res.status(500).json({ success: false, error: "Failed to fetch unread messages" });
    }
  };

  // ✅ Mark messages as read for current user only
  markMessagesAsRead = async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await Message.updateMany(
        { readBy: { $ne: userId } }, // ✅ Find messages not yet read by the user
        { $push: { readBy: userId } } // ✅ Add userId to readBy array
      );

      res.status(200).json({ success: true, message: "Messages marked as read." });
    } catch (err) {
      res.status(500).json({ success: false, error: "Failed to mark messages as read" });
    }
  };
}

export default new MessageController();
