import { useState } from "react";
import axios from "axios";
import Rating from "react-rating-stars-component";
import Navbar from "./Navbar";
import { 
  CContainer, 
  CCard, 
  CCardBody, 
  CCardHeader, 
  CForm, 
  CFormInput, 
  CFormTextarea, 
  CButton,
  CRow, 
  CCol 
} from "@coreui/react";
import { cilStar } from '@coreui/icons';
import CIcon from '@coreui/icons-react';

const API_URL = import.meta.env.VITE_API_URL;

const Feedback = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    rating: 0,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRatingChange = (newRating) => {
    setFormData({ ...formData, rating: newRating });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert("All fields are required!");
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/submit-feedback`, formData);
      alert(response.data.message);
      setFormData({ name: "", email: "", subject: "", message: "", rating: 0 });
    } catch (error) {
      alert("Error submitting feedback. Please try again.");
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />
      
      <div className="hero-section position-relative overflow-hidden text-white d-flex align-items-center justify-content-center"
        style={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          height: '400px',
          clipPath: 'polygon(0 0, 100% 0, 100% 90%, 0 100%)'
        }}>
        <div className="text-center w-100 px-3" style={{ zIndex: 2 }}>
          <h1 className="display-4 fw-bold mb-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>We Value Your Feedback</h1>
          <p className="lead mb-4 fs-4" style={{ opacity: 0.9 }}>Help us improve our services by sharing your thoughts</p>
        </div>
      </div>
      
      <main className="flex-grow-1 py-5">
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={8} lg={6}>
              <CCard className="shadow-lg p-4 border-0" style={{ borderRadius: "12px" }}>
                <CCardHeader className="text-center fs-3 fw-bold bg-transparent border-0">Share Your Feedback</CCardHeader>
                <CCardBody>
                  <div className="text-center mb-3">
                    <p className="mb-2">Rate your experience</p>
                    <Rating count={5} value={formData.rating} size={30} onChange={handleRatingChange} />
                  </div>
                  <CForm className="d-flex flex-column gap-3" onSubmit={handleSubmit}>
                    <CFormInput type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
                    <CFormInput type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                    <CFormInput type="text" name="subject" placeholder="Subject" value={formData.subject} onChange={handleChange} required />
                    <CFormTextarea name="message" rows={4} placeholder="Write your feedback here..." value={formData.message} onChange={handleChange} required />
                    <CButton type="submit" className="text-white fw-bold border-0" style={{ background: "linear-gradient(to right, #4A90E2, #8E44AD)" }}>
                      Submit Feedback
                    </CButton>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CContainer>
      </main>
    </div>
  );
};

export default Feedback;
