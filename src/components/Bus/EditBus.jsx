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
  CRow,
  CFormSelect,
  CSpinner,
  CAlert,
  CInputGroup,
  CInputGroupText,
  CFormFeedback
} from "@coreui/react";
import { cilArrowLeft } from "@coreui/icons";
import CIcon from "@coreui/icons-react";

function EditBus({ busId, onBusUpdated, onClose }) {
  const [formData, setFormData] = useState({
    busNumber: "",
    capacity: "",
    status: "active",
    driverId: "",
    routeId: ""
  });
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !busId) {
      setError("Unauthorized or missing bus ID");
      setPageLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [busRes, driversRes, routesRes] = await Promise.all([
          axios.get(`${API_URL}/Bus/${busId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/driver/unassigned`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/allRoutes`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        const busData = busRes.data.bus;
        setFormData({
          busNumber: busData?.busNumber || "",
          capacity: busData?.capacity ? Number(busData.capacity) : "",
          status: busData?.status || "active",
          driverId: busData?.driverId?._id || "",
          routeId: busData?.routeId?._id || ""
        });

        // Transform drivers data to include both _id and userId
        const formattedDrivers = driversRes.data.drivers.map(driver => ({
          ...driver,
          id: driver._id, // Ensure we have the driver's ID
          userId: driver.userId // Keep the user reference
        }));

        setDrivers(formattedDrivers || []);
        setRoutes(routesRes.data.routes || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data. Please try again.");
        console.error("API Error:", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [busId]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.busNumber.trim()) {
      errors.busNumber = "Bus number is required";
    }
    
    if (!formData.capacity || formData.capacity <= 0) {
      errors.capacity = "Capacity must be a positive number";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `${API_URL}/updateBus/${busId}`,
        {
          busNumber: formData.busNumber,
          capacity: Number(formData.capacity),
          status: formData.status,
          driverId: formData.driverId || null, // Fixed: using formData.driverId instead of data.driverId
          routeId: formData.routeId || null
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setSuccess("Bus updated successfully!");
      onBusUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Update failed. Please try again.");
      console.error("Update Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <CSpinner color="primary" />
        <span className="ms-2">Loading bus data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <CCol xs={12}>
        <CAlert color="danger" className="text-center">
          {error}
          <div className="mt-2">
            <CButton color="secondary" onClick={onClose}>
              <CIcon icon={cilArrowLeft} className="me-1" />
              Back to Bus Table
            </CButton>
          </div>
        </CAlert>
      </CCol>
    );
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <h4>Edit Bus</h4>
            <CButton color="secondary" onClick={onClose}>
              <CIcon icon={cilArrowLeft} className="me-1" />
              Back to Bus Table
            </CButton>
          </CCardHeader>
          <CCardBody>
            {success && (
              <CAlert color="success" onClose={() => setSuccess(null)} dismissible>
                {success}
              </CAlert>
            )}
            
            <CForm onSubmit={handleSubmit}>
              <div className="mb-3">
                <CFormLabel htmlFor="busNumber">Bus Number *</CFormLabel>
                <CFormInput
                  id="busNumber"
                  name="busNumber"
                  value={formData.busNumber}
                  onChange={handleChange}
                  invalid={!!validationErrors.busNumber}
                  placeholder="Enter bus number"
                />
                <CFormFeedback invalid>{validationErrors.busNumber}</CFormFeedback>
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="capacity">Capacity *</CFormLabel>
                <CInputGroup>
                  <CFormInput
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={handleChange}
                    invalid={!!validationErrors.capacity}
                    placeholder="Enter passenger capacity"
                  />
                  <CInputGroupText>passengers</CInputGroupText>
                  <CFormFeedback invalid>{validationErrors.capacity}</CFormFeedback>
                </CInputGroup>
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="status">Status</CFormLabel>
                <CFormSelect
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </CFormSelect>
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="driverId">Driver</CFormLabel>
                <CFormSelect
                  id="driverId"
                  name="driverId"
                  value={formData.driverId}
                  onChange={handleChange}
                >
                  <option value="">Unassigned</option>
                  {drivers.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.userId?.name} ({driver.userId?.email})
                    </option>
                  ))}
                </CFormSelect>
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="routeId">Route</CFormLabel>
                <CFormSelect
                  id="routeId"
                  name="routeId"
                  value={formData.routeId}
                  onChange={handleChange}
                >
                  <option value="">Unassigned</option>
                  {routes.map((route) => (
                    <option key={route._id} value={route._id}>
                      {route.routeName} ({route.startLocation?.name} → {route.endLocation?.name})
                    </option>
                  ))}
                </CFormSelect>
              </div>

              <div className="d-flex gap-2">
                <CButton 
                  type="submit" 
                  color="primary" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <CSpinner size="sm" />
                      <span className="ms-2">Updating...</span>
                    </>
                  ) : "Update Bus"}
                </CButton>
                <CButton 
                  color="secondary" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
}

export default EditBus;