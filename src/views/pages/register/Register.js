import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilUser, cilLockLocked, cilCarAlt, cilSettings } from '@coreui/icons';
const API_URL=import.meta.env.VITE_API_URL; 

const Register = () => {
  const [role, setRole] = useState('Student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !role) {
      alert("All fields are required");
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

      if (response.status === 201) {
        alert("Student registered successfully!");
        navigate('/');
      }
    } catch (err) {
      if (err.response.status === 400) {
        alert("Email already exists. Please use a different email.");
      } else {
        alert("Registration failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { label: 'Student', icon: cilUser },
    { label: 'Driver', icon: cilCarAlt },
    { label: 'Admin', icon: cilSettings },
  ];

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(to right, #4A90E2, #8E44AD)",
      }}
    >
      <CCard className="p-4 shadow-lg" style={{ width: "400px", borderRadius: "12px", background: "#fff" }}>
        <CCardBody>
          <h3 className="text-center fw-bold mb-1">Create an Account</h3>
          <p className="text-center text-muted mb-4">Sign up to start tracking buses</p>

          <div className="d-flex justify-content-center mb-4 gap-2">
            {roles.map((r) => (
              <CButton
                key={r.label}
                type="button"
                color={role === r.label ? 'primary' : 'outline-primary'}
                className={`d-flex align-items-center gap-2 px-3 py-2 rounded-pill ${
                  role === r.label ? 'border-bottom border-3 border-primary' : ''
                }`}
                onClick={() => setRole(r.label)}
                title={`Register as ${r.label}`}
              >
                <CIcon icon={r.icon} /> {r.label}
              </CButton>
            ))}
          </div>

          <CForm onSubmit={handleSubmit}>
            <CInputGroup className="mb-3">
              <CInputGroupText>
                <CIcon icon={cilUser} />
              </CInputGroupText>
              <CFormInput
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </CInputGroup>

            <CInputGroup className="mb-3">
              <CInputGroupText>@</CInputGroupText>
              <CFormInput
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </CInputGroup>

            <CInputGroup className="mb-3">
              <CInputGroupText>
                <CIcon icon={cilLockLocked} />
              </CInputGroupText>
              <CFormInput
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </CInputGroup>

            <CRow>
              <CCol xs={12} className="text-center">
                <CButton type="submit" color="primary" className="px-5" disabled={loading}>
                  {loading ? "Creating..." : "Create Account"}
                </CButton>
              </CCol>
            </CRow>

            <div className="text-center mt-3">
              <small>
                Already have an account? <Link to="/login" className="text-primary">Sign in</Link>
              </small>
              <br />
              <small className="text-body-secondary">
                This is a demo app. Account creation is simulated.
              </small>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default Register;
