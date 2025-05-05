import { useState, useEffect } from "react";
import axios from "axios";
import {
  CButton,
  CForm,
  CFormInput,
  CFormTextarea,
  CCard,
  CCardBody,
  CCardHeader,
  CContainer,
  CAlert,
  CRow,
  CCol,
  CSpinner,
  CBadge,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CModalTitle,
} from "@coreui/react";
import { Trash2, Send, Mail, Clock, AlertCircle, CheckCircle } from "lucide-react";
import {
  AppBreadcrumb,
  AppContent,
  AppFooter,
  AppHeader,
  AppSidebar,
} from "../../components/index";

const API_URL = import.meta.env.VITE_API_URL;

const SendMessages = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState([]);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const token = localStorage.getItem("token");

  // Axios instance with auth header
  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/messages");
        setMessages(response.data.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to fetch messages. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // Send new message
  const sendMessage = async () => {
    if (!title || !content) {
      setError("Both title and message content are required.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await axiosInstance.post("/send-message", {
        title,
        content,
      });

      setSuccess("Message sent successfully!");
      setMessages((prev) => [response.data.data, ...prev]);
      setTitle("");
      setContent("");
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.response?.data?.message || "Failed to send the message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a message
  const deleteMessage = async () => {
    if (!messageToDelete) return;
    
    try {
      await axiosInstance.delete(`delete/messages/${messageToDelete}`);
      setMessages(messages.filter((msg) => msg._id !== messageToDelete));
      setSuccess("Message deleted successfully!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Error deleting message:", err);
      setError("Failed to delete message.");
    } finally {
      setDeleteModalVisible(false);
      setMessageToDelete(null);
    }
  };

  const confirmDelete = (id) => {
    setMessageToDelete(id);
    setDeleteModalVisible(true);
  };

  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1 px-4">
          <CContainer className="py-4">
            {/* Breadcrumb */}
            <AppBreadcrumb
              items={[
                { path: "/dashboard", name: "Dashboard" },
                { name: "Send Messages" },
              ]}
            />
            
            {/* Send Message Form */}
            <CCard className="mb-4 shadow-sm">
              <CCardHeader className="bg-primary text-white">
                <div className="d-flex align-items-center">
                  <Send className="me-2" size={20} />
                  <h5 className="mb-0">Send Message to All Users</h5>
                </div>
              </CCardHeader>
              <CCardBody>
                {success && (
                  <CAlert color="success" className="d-flex align-items-center">
                    <CheckCircle className="me-2" size={18} />
                    {success}
                  </CAlert>
                )}
                {error && (
                  <CAlert color="danger" className="d-flex align-items-center">
                    <AlertCircle className="me-2" size={18} />
                    {error}
                  </CAlert>
                )}
                <CForm>
                  <div className="mb-3">
                    <CFormInput
                      label="Title"
                      placeholder="Enter message title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <CFormTextarea
                      label="Message Content"
                      rows="5"
                      placeholder="Type your message here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                  <div className="d-flex justify-content-end">
                    <CButton
                      color="primary"
                      onClick={sendMessage}
                      disabled={loading || !title || !content}
                    >
                      {loading ? (
                        <>
                          <CSpinner component="span" size="sm" aria-hidden="true" />
                          <span className="ms-2">Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="me-2" size={18} />
                          Send Message
                        </>
                      )}
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>

            {/* Messages List */}
            <CCard className="shadow-sm">
              <CCardHeader className="bg-light">
                <div className="d-flex align-items-center">
                  <Mail className="me-2" size={20} />
                  <h5 className="mb-0">Sent Messages</h5>
                  <CBadge color="info" className="ms-2">
                    {messages.length} {messages.length === 1 ? "Message" : "Messages"}
                  </CBadge>
                </div>
              </CCardHeader>
              <CCardBody>
                {loading && messages.length === 0 ? (
                  <div className="text-center py-5">
                    <CSpinner color="primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <CAlert color="info" className="text-center">
                    No messages have been sent yet.
                  </CAlert>
                ) : (
                  <CRow className="g-4">
                    {messages.map((msg) => (
                      <CCol key={msg._id} xs="12" md="6" lg="4">
                        <CCard className="h-100 message-card">
                          <CCardHeader className="d-flex justify-content-between align-items-center bg-light">
                            <h6 className="mb-0 text-truncate">{msg.title}</h6>
                            <CButton
                              color="danger"
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(msg._id)}
                              title="Delete message"
                            >
                              <Trash2 size={16} />
                            </CButton>
                          </CCardHeader>
                          <CCardBody className="d-flex flex-column">
                            <div className="message-content flex-grow-1">
                              <p className="mb-3">{msg.content}</p>
                            </div>
                            <div className="text-end text-muted small mt-auto">
                              <div className="d-flex align-items-center justify-content-end">
                                <Clock className="me-1" size={14} />
                                <span>{new Date(msg.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </CCardBody>
                        </CCard>
                      </CCol>
                    ))}
                  </CRow>
                )}
              </CCardBody>
            </CCard>
          </CContainer>
        </div>
        <AppFooter />
      </div>

      {/* Delete Confirmation Modal */}
      <CModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
      >
        <CModalHeader closeButton>
          <CModalTitle>Confirm Deletion</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete this message? This action cannot be undone.
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setDeleteModalVisible(false)}
          >
            Cancel
          </CButton>
          <CButton color="danger" onClick={deleteMessage}>
            Delete Message
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Custom Styling */}
      <style jsx>{`
        .message-card {
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        .message-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: rgba(0, 123, 255, 0.3);
        }
        .message-content {
          min-height: 100px;
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
};

export default SendMessages;