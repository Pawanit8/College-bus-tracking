import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  CForm, CFormInput, CFormSelect, CButton, 
  CRow, CCol, CSpinner, CAlert 
} from "@coreui/react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const EditRoute = ({ routeData, onRouteUpdated, onClose }) => {
  const [formData, setFormData] = useState({
    routeName: "",
    startLocation: { name: "", latitude: "", longitude: "", time: "" },
    endLocation: { name: "", latitude: "", longitude: "", time: "" },
    stops: [{ name: "", latitude: "", longitude: "", estimatedArrivalTime: "", time: "" }],
    totalDistance: "",
    estimatedDuration: "",
    assignedBus: ""
  });
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (routeData) {
      setFormData({
        routeName: routeData.routeName,
        startLocation: routeData.startLocation,
        endLocation: routeData.endLocation,
        stops: routeData.stops,
        totalDistance: routeData.totalDistance,
        estimatedDuration: routeData.estimatedDuration,
        assignedBus: routeData.assignedBus?._id || ""
      });
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    axios.get(`${API_URL}/allBuses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setBuses(res.data.buses || []))
    .catch(err => console.error("Error fetching buses:", err));
  }, [routeData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (e, locationType, field) => {
    setFormData(prev => ({
      ...prev,
      [locationType]: {
        ...prev[locationType],
        [field]: e.target.value
      }
    }));
  };

  const handleStopChange = (index, e, field) => {
    const newStops = [...formData.stops];
    newStops[index] = { ...newStops[index], [field]: e.target.value };
    setFormData(prev => ({ ...prev, stops: newStops }));
  };

  const addStop = () => {
    setFormData(prev => ({
      ...prev,
      stops: [...prev.stops, { 
        name: "", 
        latitude: "", 
        longitude: "", 
        estimatedArrivalTime: "",
        time: ""
      }]
    }));
  };

  const removeStop = (index) => {
    if (formData.stops.length > 1) {
      setFormData(prev => ({
        ...prev,
        stops: prev.stops.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized: Please log in.");
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API_URL}/updateRoute/${routeData._id}`, {
        ...formData,
        startLocation: {
          ...formData.startLocation,
          latitude: parseFloat(formData.startLocation.latitude),
          longitude: parseFloat(formData.startLocation.longitude)
        },
        endLocation: {
          ...formData.endLocation,
          latitude: parseFloat(formData.endLocation.latitude),
          longitude: parseFloat(formData.endLocation.longitude)
        },
        stops: formData.stops.map(stop => ({
          ...stop,
          _id: stop._id || undefined, // Preserve existing IDs
          latitude: parseFloat(stop.latitude),
          longitude: parseFloat(stop.longitude),
          estimatedArrivalTime: parseInt(stop.estimatedArrivalTime)
        })),
        totalDistance: parseFloat(formData.totalDistance),
        estimatedDuration: parseInt(formData.estimatedDuration),
        assignedBus: formData.assignedBus || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRouteUpdated();
    } catch (error) {
      console.error("Error updating route:", error);
      setError(error.response?.data?.message || "Failed to update route");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CForm onSubmit={handleSubmit}>
      {error && <CAlert color="danger">{error}</CAlert>}
      
      <CRow className="mb-3">
        <CCol md={6}>
          <CFormInput
            type="text"
            label="Route Name"
            name="routeName"
            value={formData.routeName}
            onChange={handleChange}
            required
          />
        </CCol>
      </CRow>

      <h5>Start Location</h5>
      <CRow className="mb-3">
        <CCol md={4}>
          <CFormInput
            type="text"
            label="Location Name"
            value={formData.startLocation.name}
            onChange={(e) => handleLocationChange(e, "startLocation", "name")}
            required
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="number"
            step="0.000001"
            label="Latitude"
            value={formData.startLocation.latitude}
            onChange={(e) => handleLocationChange(e, "startLocation", "latitude")}
            required
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="number"
            step="0.000001"
            label="Longitude"
            value={formData.startLocation.longitude}
            onChange={(e) => handleLocationChange(e, "startLocation", "longitude")}
            required
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="time"
            label="Departure Time"
            value={formData.startLocation.time}
            onChange={(e) => handleLocationChange(e, "startLocation", "time")}
            required
          />
        </CCol>
      </CRow>

      <h5>Route Stops</h5>
      {formData.stops.map((stop, index) => (
        <CRow className="mb-3" key={index}>
          <CCol md={3}>
            <CFormInput
              type="text"
              label={`Stop ${index + 1} Name`}
              value={stop.name}
              onChange={(e) => handleStopChange(index, e, "name")}
              required
            />
          </CCol>
          <CCol md={2}>
            <CFormInput
              type="number"
              step="0.000001"
              label="Latitude"
              value={stop.latitude}
              onChange={(e) => handleStopChange(index, e, "latitude")}
              required
            />
          </CCol>
          <CCol md={2}>
            <CFormInput
              type="number"
              step="0.000001"
              label="Longitude"
              value={stop.longitude}
              onChange={(e) => handleStopChange(index, e, "longitude")}
              required
            />
          </CCol>
          <CCol md={2}>
            <CFormInput
              type="time"
              label="Arrival Time"
              value={stop.time}
              onChange={(e) => handleStopChange(index, e, "time")}
              required
            />
          </CCol>
          <CCol md={2}>
            <CFormInput
              type="number"
              label="Minutes From Start"
              value={stop.estimatedArrivalTime}
              onChange={(e) => handleStopChange(index, e, "estimatedArrivalTime")}
              required
            />
          </CCol>
          <CCol md={1} className="d-flex align-items-end">
            <CButton 
              color="danger" 
              onClick={() => removeStop(index)}
              disabled={formData.stops.length <= 1}
            >
              Remove
            </CButton>
          </CCol>
        </CRow>
      ))}

      <CRow className="mb-3">
        <CCol>
          <CButton color="secondary" onClick={addStop}>
            Add Stop
          </CButton>
        </CCol>
      </CRow>

      <h5>End Location</h5>
      <CRow className="mb-3">
        <CCol md={4}>
          <CFormInput
            type="text"
            label="Location Name"
            value={formData.endLocation.name}
            onChange={(e) => handleLocationChange(e, "endLocation", "name")}
            required
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="number"
            step="0.000001"
            label="Latitude"
            value={formData.endLocation.latitude}
            onChange={(e) => handleLocationChange(e, "endLocation", "latitude")}
            required
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="number"
            step="0.000001"
            label="Longitude"
            value={formData.endLocation.longitude}
            onChange={(e) => handleLocationChange(e, "endLocation", "longitude")}
            required
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="time"
            label="Arrival Time"
            value={formData.endLocation.time}
            onChange={(e) => handleLocationChange(e, "endLocation", "time")}
            required
          />
        </CCol>
      </CRow>

      <CRow className="mb-3">
        <CCol md={3}>
          <CFormInput
            type="number"
            step="0.1"
            label="Total Distance (km)"
            name="totalDistance"
            value={formData.totalDistance}
            onChange={handleChange}
            required
          />
        </CCol>
        <CCol md={3}>
          <CFormInput
            type="number"
            label="Estimated Duration (minutes)"
            name="estimatedDuration"
            value={formData.estimatedDuration}
            onChange={handleChange}
            required
          />
        </CCol>
      </CRow>

      <CRow className="mb-3">
        <CCol md={6}>
          <CFormSelect
            label="Assign Bus"
            name="assignedBus"
            value={formData.assignedBus}
            onChange={handleChange}
          >
            <option value="">None</option>
            {buses.map((bus) => (
              <option key={bus._id} value={bus._id}>{bus.busNumber}</option>
            ))}
          </CFormSelect>
        </CCol>
      </CRow>

      <CRow className="mb-3">
        <CCol>
          <CButton 
            type="submit" 
            color="primary" 
            className="me-2"
            disabled={loading}
          >
            {loading ? <CSpinner size="sm" /> : "Save Changes"}
          </CButton>
          <CButton color="secondary" onClick={onClose}>
            Cancel
          </CButton>
        </CCol>
      </CRow>
    </CForm>
  );
};

export default EditRoute;