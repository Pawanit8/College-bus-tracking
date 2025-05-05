import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";
import {
  CButton,
  CCard,
  CCardBody,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilUser, cilCarAlt, cilSettings } from '@coreui/icons';
const API_URL=import.meta.env.VITE_API_URL 

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password, role });

      if (response.status === 200 && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("role", role);

        alert("Login successful!");

        switch (role) {
          case 'Admin':
            navigate('/dashboard');
            break;
          case 'Driver':
            navigate(`/driver-dashboard`);
            // navigate(`/edituser/${user.id}`)
            break;
          case 'User':
          default:
            navigate('/student-dashboard');
            break;
        }
      } else {
        alert("Login failed. No token received.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed. Please try again.");
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
          <h3 className="text-center fw-bold mb-1">Welcome Back</h3>
          <p className="text-center text-muted mb-4">Sign in to access your dashboard</p>

          <div className="d-flex justify-content-center gap-2 mb-4">
            {roles.map((r) => (
              <CButton
                key={r.label}
                type="button"
                color={role === r.label ? 'primary' : 'light'}
                className={`d-flex align-items-center gap-2 px-3 py-2 border rounded-pill ${role === r.label ? 'border-2 border-primary text-white' : 'border-secondary text-dark'}`}
                onClick={() => setRole(r.label)}
                style={{ borderBottom: role === r.label ? '3px solid #0d6efd' : 'none' }}
              >
                <CIcon icon={r.icon} /> {r.label}
              </CButton>
            ))}
          </div>

          <CForm onSubmit={handleLogin}>
            <CInputGroup className="mb-3">
              <CInputGroupText>
                <CIcon icon={cilUser} />
              </CInputGroupText>
              <CFormInput
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </CInputGroup>

            <CInputGroup className="mb-4">
              <CInputGroupText>
                <CIcon icon={cilLockLocked} />
              </CInputGroupText>
              <CFormInput
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </CInputGroup>

            <CButton type="submit" color="primary" className="w-100 mb-3" disabled={loading}>
              {loading ? 'Logging in...' : `Login as ${role}`}
            </CButton>

            <div className="text-center">
              <small className="text-muted">
                Don’t have an account? <Link to="/register" className="text-primary">Sign up</Link>
              </small>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default LoginPage;
