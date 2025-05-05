import { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CCardFooter,
  CAlert,
  CSpinner,
} from "@coreui/react";
import Navbar from "./Navbar";
import { MessageSquare } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const socket = io(API_URL, { autoConnect: false });

const ShowMessage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axiosInstance.get("/messages");
        if (Array.isArray(response.data.data)) {
          setMessages(response.data.data);
        } else {
          setMessages([]);
          setError("Unexpected response format");
        }
      } catch (err) {
        setMessages([]);
        setError("Failed to load messages.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const markAsRead = async () => {
      try {
        await axiosInstance.put("/messages/mark-as-read");
      } catch (error) {
        console.log("⚠️ Failed to mark messages as read", error);
      }
    };
    markAsRead();

    socket.connect();
    socket.off("new-message").on("new-message", (newMessage) => {
      setMessages((prevMessages) => [newMessage, ...prevMessages]);
    });

    return () => {
      socket.off("new-message");
      socket.disconnect();
    };
  }, []);

  return (
    <div className="show-messages">
      <Navbar />
      <CContainer className="py-5">
        <h2 className="text-center fw-bold text-primary mb-4">
          📩 Admin Messages
        </h2>

        {loading && (
          <div className="text-center my-4">
            <CSpinner color="primary" />
          </div>
        )}

        {error && (
          <CAlert color="danger" className="text-center">
            {error}
          </CAlert>
        )}

        {!loading && messages.length === 0 && (
          <CAlert color="info" className="text-center">
            No messages available.
          </CAlert>
        )}

        <CRow className="g-4 justify-content-center">
          {messages.map((msg) => (
            <CCol key={msg._id} xs="12" md="8">
              <CCard className="message-card">
                <CCardHeader className="message-header">
                  <MessageSquare size={24} className="me-2 text-white" />
                  <h5 className="mb-0">{msg.title}</h5>
                </CCardHeader>
                <CCardBody className="message-body">
                  <p className="message-content">{msg.content}</p>
                </CCardBody>
                <CCardFooter className="message-footer">
                  <small>{new Date(msg.createdAt).toLocaleString()}</small>
                </CCardFooter>
              </CCard>
            </CCol>
          ))}
        </CRow>
      </CContainer>

      {/* Custom Styling */}
      <style jsx>{`
        .message-card {
          border-radius: 10px;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
        }
        .message-card:hover {
          transform: translateY(-5px);
          box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.15);
        }
        .message-header {
          display: flex;
          align-items: center;
          background-color: #007bff;
          color: white;
          padding: 15px;
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
        }
        .message-body {
          padding: 20px;
          font-size: 16px;
          color: #333;
          line-height: 1.6;
        }
        .message-footer {
          background-color: #f8f9fa;
          padding: 10px 15px;
          text-align: right;
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
          font-size: 14px;
          color: #777;
        }
      `}</style>
    </div>
  );
};

export default ShowMessage;
