import FeedbackModel from "../model/FeedbackModel.js";

// Submit Feedback
class FeedbackController {
   

// Submit feedback
submitFeedback = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const feedback = new FeedbackModel({ name, email, subject, message });
    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get all feedback (Admin Only)
getFeedback = async (req, res) => {
  try {
    const feedbacks = await FeedbackModel.find();
    const formattedFeedbacks = feedbacks.map(fb => ({
        ...fb._doc,
        user: { name: fb.name, email: fb.email }
    }));
    res.json(formattedFeedbacks);
} catch (error) {
    res.status(500).json({ success: false, message: "Error fetching feedback", error: error.message });
}
};

// Delete feedback manually (Optional)
 
deletefeedbackById= async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFeedback = await FeedbackModel.findByIdAndDelete(id);

    if (!deletedFeedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }

    res.status(200).json({ success: true, message: "Feedback deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting feedback", error: err.message });
  }
};
  

getUnreadFeedback=async (req, res) => {
  try {
    const unreadCount = await FeedbackModel.countDocuments({ isRead: false });
    res.status(200).json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch unread feedback count" });
  }
}

// Mark feedback as read (Optional: If needed)
markFeedbackread =async (req, res) => {
  try {
    await FeedbackModel.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ message: "Feedback marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark feedback as read" });
  }
}


    
}
export default new FeedbackController();
