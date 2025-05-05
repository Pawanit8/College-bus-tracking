import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CForm,
  CFormInput,
  CFormSelect,
  CButton,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
} from "@coreui/react";

const BusForm = ({ onBusAdded, onClose, busData }) => {
  const [busNumber, setBusNumber] = useState(busData?.busNumber || "");
  const [capacity, setCapacity] = useState(busData?.capacity || "");
  const [status, setStatus] = useState(busData?.status || "active");
  const [driver, setDriver] = useState(busData?.driver?._id || "");
  const [route, setRoute] = useState(busData?.route?._id || "");
  const [latitude, setLatitude] = useState(busData?.currentLocation?.latitude || "");
  const [longitude, setLongitude] = useState(busData?.currentLocation?.longitude || "");
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [message, setMessage] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Unauthorized: Please log in.");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    axios.get(`${API_URL}/Driver/unassigned`, { headers })
      .then((res) => setDrivers(res.data.drivers || []))
      .catch((err) => console.error("Error fetching drivers:", err));

    axios.get(`${API_URL}/allRoutes`, { headers })
      .then((res) => setRoutes(res.data.routes || []))
      .catch((err) => console.error("Error fetching routes:", err));
  }, []);

  const getLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.error("Error fetching location:", error);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic form validation (you can add more as needed)
    if (!busNumber || !capacity || !latitude || !longitude) {
      setMessage("Please fill out all required fields.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized: Please log in.");
      return;
    }

    const busDetails = {
      busNumber,
      capacity,
      status,
      driverId: driver || null,
      routeId: route || null,
      currentLocation: { latitude, longitude },
    };

    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      if (busData) {
        // Update bus
        await axios.put(`${API_URL}/updateBus/${busData._id}`, busDetails, { headers });
        setMessage("Bus updated successfully!");
      } else {
        // Add new bus
        await axios.post(`${API_URL}/addBus`, busDetails, { headers });
        setMessage("Bus added successfully!");
      }
      onBusAdded();
      onClose();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error saving bus");
      console.error("Error saving bus:", error);
    }
  };

  return (
    <CCard className="p-4">
      <CCardHeader className="bg-primary text-white text-center">
        <h2 className="text-lg font-semibold">{busData ? "Update Bus" : "Add Bus"}</h2>
      </CCardHeader>
      <CCardBody>
        {message && <p className="text-danger">{message}</p>}
        <CForm onSubmit={handleSubmit}>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormInput
                type="text"
                label="Bus Number"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                required
              />
            </CCol>
            <CCol md={6}>
              <CFormInput
                type="number"
                label="Capacity"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormSelect label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </CFormSelect>
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormSelect label="Driver" value={driver} onChange={(e) => setDriver(e.target.value)}>
                <option value="">None</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.userId.name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormSelect label="Route" value={route} onChange={(e) => setRoute(e.target.value)}>
                <option value="">None</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.routeName} ({r.startLocation.name} → {r.endLocation.name})
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={5}>
              <CFormInput
                type="number"
                label="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
            </CCol>
            <CCol md={5}>
              <CFormInput
                type="number"
                label="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
            </CCol>
            <CCol md={2} className="d-flex align-items-end">
              <CButton type="button" color="info" onClick={getLocation}>
                📍 Get Location
              </CButton>
            </CCol>
          </CRow>
          <div className="d-flex justify-content-end">
            <CButton type="submit" color="primary">
              {busData ? "Update Bus" : "Add Bus"}
            </CButton>
            <CButton type="button" color="secondary" className="ms-2" onClick={onClose}>
              Cancel
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

export default BusForm;