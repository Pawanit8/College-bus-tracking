import { useEffect, useState } from "react";
import axios from "axios";
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
  CBadge,
  CAvatar,
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilTrash, cilUser } from "@coreui/icons";
import AppHeader from "../../components/AppHeader";
import { AppSidebar, AppFooter } from "../../components/index";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

const ShowFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchFeedback();
    fetchUnreadCount();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-feedback`, getAuthHeaders());
      if (Array.isArray(response.data)) {
        // Sort feedbacks by createdAt in descending order
        const sortedFeedbacks = response.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setFeedbacks(sortedFeedbacks);
      } else {
        setError("Unexpected response format");
      }
    } catch (err) {
      setError("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-unread-feedback`, getAuthHeaders());
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  const confirmDelete = (feedback) => {
    setSelectedFeedback(feedback);
    setDeleteModal(true);
  };

  const deleteFeedback = async () => {
    if (!selectedFeedback) return;

    try {
      const response = await axios.delete(
        `${API_URL}/delete-feedback/${selectedFeedback._id}`,
        getAuthHeaders()
      );

      if (response.status === 200) {
        setFeedbacks((prev) => prev.filter((fb) => fb._id !== selectedFeedback._id));
        if (!selectedFeedback.isRead) {
          setUnreadCount((prev) => Math.max(prev - 1, 0));
        }
      } else {
        setError("Failed to delete feedback");
      }
    } catch (err) {
      setError("Failed to delete feedback");
    } finally {
      setDeleteModal(false);
      setSelectedFeedback(null);
    }
  };

  const markAsRead = async (id) => {
    try {
      const feedback = feedbacks.find((fb) => fb._id === id);
      if (!feedback || feedback.isRead) return;

      await axios.put(`${API_URL}/mark-feedback-read/${id}`, {}, getAuthHeaders());

      setFeedbacks((prev) =>
        prev.map((fb) => (fb._id === id ? { ...fb, isRead: true } : fb))
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader unreadCount={unreadCount} />
        <div className="body flex-grow-1 bg-light">
          <CContainer className="py-4">
            <CCard className="border-0 shadow-lg rounded-3 animate-fade-in">
              <CCardHeader className="text-center bg-primary text-white rounded-top">
                <h3 className="fw-bold">📢 User Feedback</h3>
                {unreadCount > 0 && (
                  <CBadge color="danger" className="ms-2">
                    {unreadCount} Unread
                  </CBadge>
                )}
              </CCardHeader>
              <CCardBody>
                {loading && (
                  <div className="text-center my-4">
                    <CSpinner color="primary" />
                  </div>
                )}
                {error && <CAlert color="danger">{error}</CAlert>}
                {!loading && !error && feedbacks.length === 0 && (
                  <CAlert color="info">No feedback available.</CAlert>
                )}

                <CRow className="g-4 mt-2">
                  {feedbacks.map((feedback) => (
                    <CCol key={feedback._id} xs="12" md="6" lg="6">
                      <CCard
                        className={`shadow-sm border rounded transition-card ${
                          feedback.isRead ? "bg-white" : "bg-warning bg-opacity-25"
                        }`}
                        onClick={() => markAsRead(feedback._id)}
                        style={{ cursor: "pointer", transition: "0.3s" }}
                      >
                        <CCardHeader className="d-flex justify-content-between align-items-center p-3 bg-light border-bottom">
                          <div className="d-flex align-items-center">
                            <CAvatar color="info" size="lg" className="me-3">
                              <CIcon icon={cilUser} size="lg" />
                            </CAvatar>
                            <div>
                              <h6 className="mb-1 fw-bold text-primary">{feedback.name}</h6>
                              <CBadge color="dark">{feedback.email}</CBadge>
                            </div>
                          </div>
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(feedback);
                            }}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </CCardHeader>
                        <CCardBody className="p-4">
                          <h6 className="text-dark fw-bold">{feedback.subject}</h6>
                          <p className="text-muted">{feedback.message}</p>
                        </CCardBody>
                        <CCardFooter className="text-end bg-light border-top p-2">
                          <small className="text-muted">
                            {new Date(feedback.createdAt).toLocaleString()}
                          </small>
                        </CCardFooter>
                      </CCard>
                    </CCol>
                  ))}
                </CRow>
              </CCardBody>
            </CCard>

            <CModal visible={deleteModal} onClose={() => setDeleteModal(false)}>
              <CModalHeader closeButton>
                <h5>Confirm Deletion</h5>
              </CModalHeader>
              <CModalBody>
                Are you sure you want to delete the feedback from <strong>{selectedFeedback?.name}</strong>?
              </CModalBody>
              <CModalFooter>
                <CButton color="secondary" onClick={() => setDeleteModal(false)}>
                  Cancel
                </CButton>
                <CButton color="danger" onClick={deleteFeedback}>
                  <CIcon icon={cilTrash} className="me-2" /> Delete
                </CButton>
              </CModalFooter>
            </CModal>
          </CContainer>
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default ShowFeedback;
