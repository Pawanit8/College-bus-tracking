import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CAlert,
  CSpinner,
  CBadge
} from '@coreui/react';
import CIcon from "@coreui/icons-react";
import { cilSave, cilArrowLeft } from "@coreui/icons";

const API_URL = import.meta.env.VITE_API_URL; 

function EditUser({ userId, initialData, onUserUpdated, onClose }) {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    phone: "",
    gender: "",
    dob: "",
    role: ""
  });

  const genderOptions = [
    "Male", 
    "Female", 
    "Other", 
    "Prefer not to say"
  ];

  const roleOptions = [
    "Admin",
    "Student",
    "Driver"
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        age: initialData.age || "",
        phone: initialData.phone || "",
        gender: initialData.gender || "",
        dob: initialData.dob || "",
        role: initialData.role || ""
      });
    } else if (userId) {
      fetchUser();
    }
  }, [userId, initialData]);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized: No token found. Please log in.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data.user) {
        throw new Error("User data not found in response");
      }
      
      const user = response.data.user;
      setFormData({
        name: user.name || "",
        email: user.email || "",
        age: user.age || "",
        phone: user.phone || "",
        gender: user.gender || "",
        dob: user.dob || "",
        role: user.role || ""
      });
    } catch (err) {
      setError(err.response?.data?.message || 
              err.message || 
              "Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email) {
      setError("Name and email are required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized: Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/updateProfile/${userId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setSuccess("User updated successfully!");
        if (onUserUpdated) onUserUpdated();
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };

  if (loading && !formData.name) {
    return (
      <div className="d-flex justify-content-center my-5">
        <CSpinner color="primary" />
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <CAlert color="danger" className="m-3">
        {error}
        <CButton color="link" onClick={handleBack} className="p-0 ms-2">
          Go Back
        </CButton>
      </CAlert>
    );
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4 shadow-sm">
          <CCardHeader color="primary" className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Edit User Profile</h2>
          </CCardHeader>
          
          <CCardBody>
            {error && (
              <CAlert color="danger" dismissible onClose={() => setError(null)}>
                {error}
              </CAlert>
            )}
            
            {success && (
              <CAlert color="success" dismissible onClose={() => setSuccess(null)}>
                {success}
              </CAlert>
            )}

            <CForm onSubmit={handleSubmit} className={loading ? "pe-none" : ""}>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="name">Full Name*</CFormLabel>
                  <CFormInput
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter full name"
                    disabled={loading}
                  />
                </CCol>
                
                <CCol md={6}>
                  <CFormLabel htmlFor="email">Email Address*</CFormLabel>
                  <CFormInput
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter email address"
                    disabled={loading}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="role">Role*</CFormLabel>
                  <CFormSelect
                    id="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    {roleOptions.map(option => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={6}>
                  <CFormLabel htmlFor="phone">Phone Number</CFormLabel>
                  <CFormInput
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    disabled={loading}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="age">Age</CFormLabel>
                  <CFormInput
                    type="number"
                    id="age"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Enter age"
                    disabled={loading}
                  />
                </CCol>
                
                <CCol md={6}>
                  <CFormLabel htmlFor="gender">Gender</CFormLabel>
                  <CFormSelect
                    id="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="mb-4">
                <CCol md={6}>
                  <CFormLabel htmlFor="dob">Date of Birth</CFormLabel>
                  <CFormInput
                    type="date"
                    id="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </CCol>
              </CRow>

              <div className="d-flex justify-content-between">
                <CButton 
                  color="secondary" 
                  onClick={handleBack}
                  disabled={loading}
                >
                  <CIcon icon={cilArrowLeft} className="me-2" />
                  Back to Users
                </CButton>
                
                <CButton 
                  type="submit" 
                  color="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CIcon icon={cilSave} className="me-2" />
                      Save Changes
                    </>
                  )}
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
}

export default EditUser;