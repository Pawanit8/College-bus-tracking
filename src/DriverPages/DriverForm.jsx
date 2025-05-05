import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CButton,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CSpinner,
  CAlert,
} from "@coreui/react";
const API_URL = import.meta.env.VITE_API_URL;

function DriverForm({ onDriverAdded, onClose }) {
  const [drivers, setDrivers] = useState([]); // Changed from users to drivers for clarity
  const [buses, setBuses] = useState([]);
  const [formData, setFormData] = useState({
    userId: "",
    licenseNumber: "",
    busId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication token missing. Please log in.");
          setLoading(false);
          return;
        }

        // Fetch available drivers (already filtered by your backend)
        const driversResponse = await axios.get(`${API_URL}/getNotAssignedDriver`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch available buses (not assigned to any driver)
        const busesResponse = await axios.get(`${API_URL}/getNotAssignedBus`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Available Drivers:", driversResponse.data);
        console.log("Available Buses:", busesResponse.data);

        // Updated to match your API response structure
        setDrivers(driversResponse.data.drivers || []);
        setBuses(busesResponse.data.buses || []);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching data.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    // Validate form data
    if (!formData.userId || !formData.licenseNumber) {
      setError("Driver and license number are required");
      setLoading(false);
      return;
    }

    console.log("Submitting driver data:", formData);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token missing. Please log in.");
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/addDriver`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 201) {
        setSuccess("Driver added successfully!");
        onDriverAdded(); // Refresh parent component
        setTimeout(() => {
          onClose(); // Close the form after success
        }, 1500);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.error || 
                      "Error adding driver. Please try again.";
      setError(errorMsg);
      console.error("Error adding driver:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CForm onSubmit={handleSubmit}>
      {error && <CAlert color="danger">{error}</CAlert>}
      {success && <CAlert color="success">{success}</CAlert>}

      <div className="mb-3">
        <CFormLabel>Select Driver</CFormLabel>
        <CFormSelect 
          name="userId" 
          value={formData.userId} 
          onChange={handleChange} 
          required
          disabled={loading}
        >
          <option value="">Choose a driver</option>
          {drivers.map((driver) => (
            <option key={driver._id} value={driver._id}>
              {driver.name} ({driver.email})
            </option>
          ))}
        </CFormSelect>
      </div>

      <div className="mb-3">
        <CFormLabel>License Number</CFormLabel>
        <CFormInput 
          type="text" 
          name="licenseNumber" 
          value={formData.licenseNumber} 
          onChange={handleChange} 
          required 
          disabled={loading}
          placeholder="Enter driver's license number"
        />
      </div>

      <div className="mb-3">
        <CFormLabel>Assign Bus (Optional)</CFormLabel>
        <CFormSelect 
          name="busId" 
          value={formData.busId} 
          onChange={handleChange}
          disabled={loading}
        >
          <option value="">No Bus Assigned</option>
          {buses.map((bus) => (
            <option key={bus._id} value={bus._id}>
              {bus.busNumber || "Bus ID: " + bus._id}
            </option>
          ))}
        </CFormSelect>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <CButton 
          type="button" 
          color="secondary" 
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </CButton>
        <CButton 
          type="submit" 
          color="primary" 
          disabled={loading}
        >
          {loading ? <CSpinner size="sm" /> : "Add Driver"}
        </CButton>
      </div>
    </CForm>
  );
}

export default DriverForm;