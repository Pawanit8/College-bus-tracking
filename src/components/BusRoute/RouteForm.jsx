import React, { useEffect, useState } from "react";
import axios from "axios";
import { CForm, CFormInput, CFormSelect, CButton, CRow, CCol, CFormLabel } from "@coreui/react";

const RouteForm = ({ onRouteAdded, onClose, routeData }) => {
  const [routeName, setRouteName] = useState(routeData?.routeName || "");
  const [startLocation, setStartLocation] = useState(routeData?.startLocation || { 
    name: "", 
    latitude: "", 
    longitude: "",
    time: "08:00" // Default start time
  });
  const [endLocation, setEndLocation] = useState(routeData?.endLocation || { 
    name: "", 
    latitude: "", 
    longitude: "",
    time: "17:00" // Default end time
  });
  const [stops, setStops] = useState(routeData?.stops || [{ 
    name: "", 
    latitude: "", 
    longitude: "", 
    estimatedArrivalTime: "",
    time: ""
  }]);
  const [totalDistance, setTotalDistance] = useState(routeData?.totalDistance || "");
  const [estimatedDuration, setEstimatedDuration] = useState(routeData?.estimatedDuration || "");
  const [assignedBus, setAssignedBus] = useState(routeData?.assignedBus?._id || "");
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Unauthorized: No token found");
      return;
    }

    axios.get("http://localhost:3010/api/allBuses", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setBuses(res.data.buses || []))
      .catch((err) => console.error("Error fetching buses:", err));
  }, []);

  const handleLocationChange = (e, locationType, field) => {
    const { value } = e.target;
    if (locationType === 'start') {
      setStartLocation((prev) => ({ ...prev, [field]: value }));
    } else if (locationType === 'end') {
      setEndLocation((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleStopChange = (index, e, field) => {
    const { value } = e.target;
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setStops(newStops);
  };

  const addStop = () => {
    setStops([...stops, { 
      name: "", 
      latitude: "", 
      longitude: "", 
      estimatedArrivalTime: "",
      time: ""
    }]);
  };

  const removeStop = (index) => {
    if (stops.length > 1) {
      setStops(stops.filter((_, i) => i !== index));
    } else {
      alert("At least one stop is required");
    }
  };

  const calculateEstimatedTimes = () => {
    if (!estimatedDuration || !startLocation.time) return;
    
    const startTime = new Date(`2000-01-01T${startLocation.time}`);
    const durationPerStop = estimatedDuration / (stops.length + 1); // +1 for end location
    
    const updatedStops = stops.map((stop, index) => {
      const minutesToAdd = Math.round((index + 1) * durationPerStop);
      const estimatedTime = new Date(startTime.getTime() + minutesToAdd * 60000);
      const timeString = estimatedTime.toTimeString().substring(0, 5);
      
      return {
        ...stop,
        time: timeString,
        estimatedArrivalTime: minutesToAdd
      };
    });

    setStops(updatedStops);
    
    // Update end location time
    const endTime = new Date(startTime.getTime() + estimatedDuration * 60000);
    setEndLocation(prev => ({
      ...prev,
      time: endTime.toTimeString().substring(0, 5)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Unauthorized: No token found");
      return;
    }

    const routeDetails = {
      routeName,
      startLocation: {
        ...startLocation,
        latitude: parseFloat(startLocation.latitude),
        longitude: parseFloat(startLocation.longitude)
      },
      endLocation: {
        ...endLocation,
        latitude: parseFloat(endLocation.latitude),
        longitude: parseFloat(endLocation.longitude)
      },
      stops: stops.map(stop => ({
        ...stop,
        latitude: parseFloat(stop.latitude),
        longitude: parseFloat(stop.longitude),
        estimatedArrivalTime: parseInt(stop.estimatedArrivalTime)
      })),
      totalDistance: parseFloat(totalDistance),
      estimatedDuration: parseInt(estimatedDuration),
      assignedBus: assignedBus || null,
    };

    try {
      if (routeData) {
        await axios.put(`http://localhost:3010/api/updateRoute/${routeData._id}`, routeDetails, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("http://localhost:3010/api/addRoute", routeDetails, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onRouteAdded();
      onClose();
    } catch (error) {
      console.error("Error saving route:", error);
    }
  };

  return (
    <CForm onSubmit={handleSubmit}>
      <CRow className="mb-3">
        <CCol md={6}>
          <CFormInput
            type="text"
            label="Route Name"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
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
            value={startLocation.name}
            onChange={(e) => handleLocationChange(e, 'start', 'name')}
            required
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="number"
            step="0.000001"
            label="Latitude"
            value={startLocation.latitude}
            onChange={(e) => handleLocationChange(e, 'start', 'latitude')}
            required
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="number"
            step="0.000001"
            label="Longitude"
            value={startLocation.longitude}
            onChange={(e) => handleLocationChange(e, 'start', 'longitude')}
            required
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="time"
            label="Departure Time"
            value={startLocation.time}
            onChange={(e) => handleLocationChange(e, 'start', 'time')}
            required
          />
        </CCol>
      </CRow>

      <h5>Route Stops</h5>
      {stops.map((stop, index) => (
        <CRow className="mb-3" key={index}>
          <CCol md={3}>
            <CFormInput
              type="text"
              label={`Stop ${index + 1} Name`}
              value={stop.name}
              onChange={(e) => handleStopChange(index, e, 'name')}
              required
            />
          </CCol>
          <CCol md={2}>
            <CFormInput
              type="number"
              step="0.000001"
              label="Latitude"
              value={stop.latitude}
              onChange={(e) => handleStopChange(index, e, 'latitude')}
              required
            />
          </CCol>
          <CCol md={2}>
            <CFormInput
              type="number"
              step="0.000001"
              label="Longitude"
              value={stop.longitude}
              onChange={(e) => handleStopChange(index, e, 'longitude')}
              required
            />
          </CCol>
          <CCol md={2}>
            <CFormInput
              type="time"
              label="Arrival Time"
              value={stop.time}
              onChange={(e) => handleStopChange(index, e, 'time')}
              required
            />
          </CCol>
          <CCol md={2}>
            <CFormInput
              type="number"
              label="Minutes From Start"
              value={stop.estimatedArrivalTime}
              onChange={(e) => handleStopChange(index, e, 'estimatedArrivalTime')}
              required
            />
          </CCol>
          <CCol md={1} className="d-flex align-items-end">
            <CButton 
              color="danger" 
              onClick={() => removeStop(index)}
              disabled={stops.length <= 1}
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
            value={endLocation.name}
            onChange={(e) => handleLocationChange(e, 'end', 'name')}
            required
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="number"
            step="0.000001"
            label="Latitude"
            value={endLocation.latitude}
            onChange={(e) => handleLocationChange(e, 'end', 'latitude')}
            required
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="number"
            step="0.000001"
            label="Longitude"
            value={endLocation.longitude}
            onChange={(e) => handleLocationChange(e, 'end', 'longitude')}
            required
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="time"
            label="Arrival Time"
            value={endLocation.time}
            onChange={(e) => handleLocationChange(e, 'end', 'time')}
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
            value={totalDistance}
            onChange={(e) => setTotalDistance(e.target.value)}
            required
          />
        </CCol>
        <CCol md={3}>
          <CFormInput
            type="number"
            label="Estimated Duration (minutes)"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            required
          />
        </CCol>
        <CCol md={3} className="d-flex align-items-end">
          <CButton 
            color="info" 
            onClick={calculateEstimatedTimes}
            disabled={!estimatedDuration || !startLocation.time}
          >
            Calculate Times
          </CButton>
        </CCol>
      </CRow>

      <CRow className="mb-3">
        <CCol md={6}>
          <CFormSelect
            label="Assign Bus"
            value={assignedBus}
            onChange={(e) => setAssignedBus(e.target.value)}
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
          <CButton type="submit" color="primary" className="me-2">
            {routeData ? "Update Route" : "Add Route"}
          </CButton>
          <CButton color="secondary" onClick={onClose}>
            Cancel
          </CButton>
        </CCol>
      </CRow>
    </CForm>
  );
};

export default RouteForm;