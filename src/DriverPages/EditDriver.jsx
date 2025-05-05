import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CButton,
  CCard,
  CCardBody,
  CFormSelect,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CRow,
  CSpinner,
  CAlert,
  CBadge
} from '@coreui/react';
import CIcon from "@coreui/icons-react";
import { cilUser  } from '@coreui/icons';

const API_URL = import.meta.env.VITE_API_URL;

function EditDriver({ driverId, onDriverUpdated, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [buses, setBuses] = useState([]);
  
  const [formData, setFormData] = useState({
    licenseNumber: "",
    busId: ""
  });

  const [driverInfo, setDriverInfo] = useState({
    name: "",
    email: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Unauthorized: Please log in.");
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch driver and buses data in parallel
        const [driverResponse, busesResponse] = await Promise.all([
          axios.get(`${API_URL}/driver/${driverId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/allBuses`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const driver = driverResponse.data.driver;
        const allBuses = busesResponse.data.buses || [];
        
        setDriverInfo({
          name: driver.userId?.name || "N/A",
          email: driver.userId?.email || "N/A"
        });

        setFormData({
          licenseNumber: driver.licenseNumber || "",
          busId: driver.busId?._id || "",
          busDetails: driver.busId
        });

        setBuses(allBuses);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Failed to fetch driver data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [driverId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
};

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-3">
        <CAlert color="danger" className="mb-3">
          {error}
        </CAlert>
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>
      </div>
    );
  }

  return (
    <CRow className="justify-content-center">
      <CCol xl={8}>
        <CCard className="mb-4 shadow-sm">
          <CCardHeader className="d-flex justify-content-between align-items-center bg-light">
            <h4 className="mb-0">Edit Driver Information</h4>
            
          </CCardHeader>
          <CCardBody>
            {error && <CAlert color="danger">{error}</CAlert>}
            
            {/* Driver Information Section */}
            <div className="mb-4 p-3 bg-light rounded">
              <h5 className="border-bottom pb-2 mb-3">Driver Details</h5>
              <CRow>
                <CCol md={6} className="mb-3">
                  <div className="d-flex align-items-center">
                    <div>
                      <small className="text-muted d-block">Full Name</small>
                      <strong>{driverInfo.name}</strong>
                    </div>
                  </div>
                </CCol>
                <CCol md={6} className="mb-3">
                  <div className="d-flex align-items-center">
                    <div>
                      <small className="text-muted d-block">Email Address</small>
                      <strong>{driverInfo.email}</strong>
                    </div>
                  </div>
                </CCol>
              </CRow>
            </div>

            {/* Editable Driver Information */}
            <CForm onSubmit={handleSubmit}>
              <h5 className="border-bottom pb-2 mb-3">Driver Configuration</h5>
              
              <div className="mb-4">
                <CFormLabel htmlFor="licenseNumber" className="fw-bold">
                  
                  License Number
                </CFormLabel>
                <CFormInput
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                  placeholder="Enter driver's license number"
                />
              </div>
              
              <div className="mb-4">
                <CFormLabel htmlFor="busId" className="fw-bold">
                  Assigned Bus
                </CFormLabel>
                <CFormSelect
                  id="busId"
                  name="busId"
                  value={formData.busId}
                  onChange={handleChange}
                  aria-label="Select bus assignment"
                >
                  <option value="">Select a bus (optional)</option>
                  {buses.map(bus => (
                    <option key={bus._id} value={bus._id}>
                      {bus.busNumber} - {bus.routeId?.routeName || 'No Route Assigned'}
                    </option>
                  ))}
                </CFormSelect>
                {formData.busDetails && (
                  <div className="mt-2 small text-muted">
                    Currently assigned to: {formData.busDetails.busNumber} - {formData.busDetails.routeId?.routeName || 'No Route'}
                  </div>
                )}
              </div>
              
              <div className="d-flex justify-content-between pt-3 border-top">
                <CButton 
                  color="secondary" 
                  onClick={onClose}
                  variant="outline"
                >
                  Cancel
                </CButton>
                <CButton 
                  type="submit" 
                  color="primary" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <CSpinner component="span" size="sm" aria-hidden="true" />
                      <span className="ms-2">Updating...</span>
                    </>
                  ) : "Save Changes"}
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
}

export default EditDriver;