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
} from "@coreui/react";
import Navbar from "./Navbar";
import { cilInfo, cilSpeedometer, cilUser } from "@coreui/icons";
import CIcon from "@coreui/icons-react";

const About = () => {
  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: "#f8f9fa" }}>
      <Navbar />

      {/* Hero Section */}
      <div
        className="hero-section position-relative overflow-hidden text-white d-flex align-items-center justify-content-center"
        style={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          height: "400px",
          clipPath: "polygon(0 0, 100% 0, 100% 90%, 0 100%)",
        }}
      >
        <div className="text-center w-100 px-3" style={{ zIndex: 2 }}>
          <h1 className="display-4 fw-bold mb-3">About Us</h1>
          <p className="lead mb-4 fs-4" style={{ opacity: 0.9 }}>
            Learn more about our mission, vision, and the team behind this project.
          </p>
        </div>
      </div>

      <main className="flex-grow-1 py-5">
        <CContainer>
          <section className="mb-5">
            <div className="text-center mb-5">
              <h2 className="fw-bold mb-3" style={{ color: "#3a7bd5" }}>Our Mission</h2>
              <p className="text-muted mx-auto" style={{ maxWidth: "600px" }}>
                We aim to revolutionize campus transportation by providing real-time bus tracking, ensuring a seamless and stress-free travel experience.
              </p>
            </div>

            <CRow className="g-4">
              <CCol md={4}>
                <CCard className="h-100 border-0 shadow-sm" style={{ borderRadius: "15px", borderTop: "4px solid #3a7bd5" }}>
                  <CCardBody className="text-center p-4">
                    <CIcon icon={cilInfo} className="text-primary mb-3" size="xl" />
                    <CCardTitle className="fw-bold mb-3" style={{ color: "#3a7bd5" }}>Transparency</CCardTitle>
                    <CCardText className="text-muted">
                      Providing accurate and reliable real-time tracking for students and faculty.
                    </CCardText>
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol md={4}>
                <CCard className="h-100 border-0 shadow-sm" style={{ borderRadius: "15px", borderTop: "4px solid #28a745" }}>
                  <CCardBody className="text-center p-4">
                    <CIcon icon={cilSpeedometer} className="text-success mb-3" size="xl" />
                    <CCardTitle className="fw-bold mb-3" style={{ color: "#28a745" }}>Efficiency</CCardTitle>
                    <CCardText className="text-muted">
                      Optimizing transportation with the latest GPS and scheduling technologies.
                    </CCardText>
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol md={4}>
                <CCard className="h-100 border-0 shadow-sm" style={{ borderRadius: "15px", borderTop: "4px solid #ffc107" }}>
                  <CCardBody className="text-center p-4">
                    <CIcon icon={cilUser} className="text-warning mb-3" size="xl" />
                    <CCardTitle className="fw-bold mb-3" style={{ color: "#ffc107" }}>User Focus</CCardTitle>
                    <CCardText className="text-muted">
                      Prioritizing student needs by enhancing safety, accessibility, and convenience.
                    </CCardText>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </section>
        </CContainer>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-light py-5 mt-auto text-center">
        <p className="mb-0">© {new Date().getFullYear()} College Bus Tracking System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default About;
