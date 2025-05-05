import React from "react";
import { 
  CContainer, 
  CRow, 
  CCol, 
  CCard, 
  CCardBody, 
  CCardTitle, 
  CCardText,
  CButton,
  CImage,
  CProgress,
  CAlert
} from "@coreui/react";
import { cilClock, cilBell, cilLocationPin, cilSpeedometer } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import Navbar from "./Navbar";
import { Link } from "react-router-dom";

const StudentDashboard = () => {
  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#eef2f7' }}>
      <Navbar />
      
      {/* Hero Section */}
      <div className="hero-section position-relative overflow-hidden text-white d-flex align-items-center justify-content-center"
           style={{
             background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
             height: '450px',
             clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)'
           }}>
        <div className="text-center w-100 px-3" style={{ zIndex: 2 }}>
          <h1 className="display-3 fw-bold mb-3" style={{ textShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>College Bus Tracking System</h1>
          <p className="lead mb-4 fs-4" style={{ opacity: 0.9 }}>Seamless, real-time tracking for campus transportation.</p>
          <CButton color="light" size="lg" className="rounded-pill px-5 fw-bold shadow-lg"
                  as={Link} to="/search-bus">
            <CIcon icon={cilLocationPin} className="me-2" /> Track My Bus
          </CButton>
        </div>
      </div>

      <main className="flex-grow-1 py-5">
        <CContainer>
          {/* Features Section */}
          <section className="mb-5">
            <div className="text-center mb-5">
              <h2 className="fw-bold mb-3" style={{ color: '#2a5298' }}>Key Features</h2>
              <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
                Stay informed with live tracking, schedules, and instant notifications.
              </p>
            </div>
            <CRow className="g-4">
              {[
                { icon: cilLocationPin, color: '#007bff', title: 'Live Tracking', text: 'Real-time GPS bus tracking with accurate arrival times.' },
                { icon: cilClock, color: '#28a745', title: 'Schedule Updates', text: 'Up-to-date schedules and route information.' },
                { icon: cilBell, color: '#ffc107', title: 'Instant Alerts', text: 'Receive notifications on delays and route changes.' }
              ].map((feature, index) => (
                <CCol md={4} key={index}>
                  <CCard className="h-100 border-0 shadow-lg rounded-4"
                         style={{ borderTop: `4px solid ${feature.color}`, transition: '0.3s ease' }}>
                    <CCardBody className="text-center p-4">
                      <div className="icon-wrapper rounded-circle d-inline-flex mb-3 p-3 shadow-sm"
                           style={{ backgroundColor: feature.color + '22' }}>
                        <CIcon icon={feature.icon} className="text-primary" size="xl" />
                      </div>
                      <CCardTitle className="fw-bold mb-3" style={{ color: feature.color }}>{feature.title}</CCardTitle>
                      <CCardText className="text-muted">{feature.text}</CCardText>
                    </CCardBody>
                  </CCard>
                </CCol>
              ))}
            </CRow>
          </section>
        </CContainer>
      </main>

      <footer className="bg-dark text-light py-5 mt-auto">
        <CContainer>
          <CRow className="g-4">
            <CCol lg={4} className="mb-4 mb-lg-0">
              <h5 className="fw-bold mb-3" style={{color: '#00d2ff'}}>College Bus Tracking System</h5>
              <p className="text-light" style={{opacity: 0.8}}>
                Providing real-time bus tracking for our campus community to ensure safe and efficient transportation.
              </p>
              <div className="d-flex gap-3 mt-3">
                <CButton color="primary" shape="rounded-pill" size="sm">
                  <i className="bi bi-facebook"></i>
                </CButton>
                <CButton color="primary" shape="rounded-pill" size="sm">
                  <i className="bi bi-twitter"></i>
                </CButton>
                <CButton color="primary" shape="rounded-pill" size="sm">
                  <i className="bi bi-instagram"></i>
                </CButton>
              </div>
            </CCol>
            <CCol md={4} lg={3} className="mb-4 mb-md-0">
              <h5 className="fw-bold mb-3" style={{color: '#00d2ff'}}>Quick Links</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a className="text-decoration-none text-light hover-effect">
                    <CIcon icon={cilClock} className="me-2" /> Schedules
                  </a>
                </li>
                <li className="mb-2">
                  <a className="text-decoration-none text-light hover-effect">
                    <CIcon icon={cilLocationPin} className="me-2" /> Routes
                  </a>
                </li>
                <li>
                  <a className="text-decoration-none text-light hover-effect">
                    <CIcon icon={cilBell} className="me-2" /> Contact
                  </a>
                </li>
              </ul>
            </CCol>
            <CCol md={4} lg={3} className="mb-4 mb-md-0">
              <h5 className="fw-bold mb-3" style={{color: '#00d2ff'}}>Support</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a className="text-decoration-none text-light hover-effect">
                    <CIcon icon={cilSpeedometer} className="me-2" /> Help Center
                  </a>
                </li>
            <li className="mb-2">
            <Link 
                to="/feedback" 
                className="text-decoration-none text-light hover-effect d-flex align-items-center"
                style={{transition: 'all 0.2s ease'}}
            >
                <CIcon icon={cilBell} className="me-2" />
                <span>Report Issue</span>
            </Link>
            </li>
                        </ul>
            </CCol>
            <CCol md={4} lg={2}>
              <h5 className="fw-bold mb-3" style={{color: '#00d2ff'}}>Download</h5>
              <CButton color="light" className="mb-2 w-100">
                <i className="bi bi-apple me-2"></i> coming soon on App Store
              </CButton>
              <CButton color="light" className="w-100">
                <i className="bi bi-google-play me-2"></i> coming soon on Play Store
              </CButton>
            </CCol>
          </CRow>
          <hr className="my-4 bg-secondary" />
          <p className="mb-0 text-center text-light" style={{opacity: 0.7}}>
            © {new Date().getFullYear()} College Bus Tracking System. All rights reserved.
          </p>
        </CContainer>
      </footer>

      <style jsx>{`
        .hero-section {
          height: 400px;
        }
        .feature-card {
          transition: all 0.3s ease;
          background-color: #fff;
        }
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
        }
        .icon-wrapper {
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        .feature-card:hover .icon-wrapper {
          transform: scale(1.1);
          background-color: rgba(58, 123, 213, 0.2) !important;
        }
        .hover-effect {
          transition: all 0.2s ease;
          opacity: 0.8;
        }
        .hover-effect:hover {
          opacity: 1;
          padding-left: 5px;
          color: #00d2ff !important;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
