import React, { useState } from 'react';
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
} from '@coreui/react';
const API_URL=import.meta.env.VITE_API_URL; 

function UserForm({ onUserAdded, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validate inputs
    if (!name || !email || !password || !role) {
      window.alert("All fields are required");
      return;
    }
  
    // Validate API_URL
    if (!API_URL) {
      window.alert("System configuration error. Please contact support.");
      return;
    }
  
    try {
      setLoading(true);
      
      const response = await axios.post(`${API_URL}/auth/register`, {
        name, 
        email, 
        password,
        role,
      });
  
      // Successful response (2xx)
      if (response.status >= 200 && response.status < 300) {
        window.alert("User registered successfully!");
        
        // Reset form
        setName("");
        setEmail("");
        setPassword("");
        setRole("");
        
        // Callbacks with safety checks
        onUserAdded && onUserAdded();
        typeof onClose === 'function' && onClose();
      } else {
        window.alert(`Unexpected response: ${response.status}`);
      }
    } catch (err) {
      console.error("Registration error:", err);
      
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 400) {
          window.alert(err.response.data.message || "Email already exists. Please use a different email.");
        } else {
          window.alert(`Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        // Request was made but no response
        window.alert("Network error. Please check your connection.");
      } else {
        // Other errors
        window.alert("Application error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader><h2>User Registration</h2></CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-3">
                <CFormLabel htmlFor="email">Email address</CFormLabel>
                <CFormInput
                  type="email"
                  id="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Name */}
              <div className="mb-3">
                <CFormLabel htmlFor="name">Full Name</CFormLabel>
                <CFormInput
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="mb-3">
                <CFormLabel htmlFor="password">Password</CFormLabel>
                <CFormInput
                  type="password"
                  id="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Role Selection Dropdown */}
              <div className="mb-3">
                <CFormLabel htmlFor="role">Role</CFormLabel>
                <CFormSelect
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Admin">Admin</option>
                  <option value="Student">Student</option>
                  <option value="Driver">Driver</option>
                </CFormSelect>
              </div>

              {/* Submit Button */}
              <CButton type="submit" color="primary" disabled={loading}>
                {loading ? "Submitting..." : "Register"}
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
}

export default UserForm;