import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CAlert,
  CBadge,
  CButton,
  CListGroup,
  CListGroupItem,
  CProgress,
  CTooltip
} from '@coreui/react';
import { 
  cilTruck, 
  cilSpeedometer, 
  cilLocationPin, 
  cilClock,
  cilUser,
  cilHistory,
  cilWarning,
  cilSync,
  cilInfo,
  cilChart
} from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import axios from 'axios';
import MapboxMap from '../../components/MapboxMap';
import AppHeader from '../../components/AppHeader';
import AppSidebar from '../../components/AppSidebar';
const API_URL = import.meta.env.VITE_API_URL;

const BusTracking = () => {
  const { id } = useParams();
  const [busData, setBusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchBusDetails = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/Bus/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setBusData(response.data.data.bus);
        setError('');
        setLastRefresh(new Date());
      } else {
        setError(response.data.message || 'Failed to fetch bus details');
      }
    } catch (err) {
      console.error('Error fetching bus details:', err);
      setError(err.response?.data?.message || 'Failed to fetch bus details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBusDetails();
    
    const interval = setInterval(fetchBusDetails, 150000);
    setRefreshInterval(interval);

    return () => clearInterval(interval);
  }, [fetchBusDetails]);

  const handleManualRefresh = () => {
    clearInterval(refreshInterval);
    fetchBusDetails();
    const interval = setInterval(fetchBusDetails, 150000);
    setRefreshInterval(interval);
  };

  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const calculateOccupancyPercentage = () => {
    if (!busData?.passengerCount || !busData?.capacity) return 0;
    return Math.min(100, Math.round((busData.passengerCount / busData.capacity) * 100));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <CSpinner color="primary" />
        <span className="ms-3">Loading bus details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <CAlert color="danger" className="d-flex align-items-center">
          <CIcon icon={cilWarning} className="me-2 flex-shrink-0" />
          <div>
            <h5>Error loading bus data</h5>
            <p className="mb-0">{error}</p>
            <CButton color="primary" size="sm" className="mt-2" onClick={fetchBusDetails}>
              <CIcon icon={cilSync} className="me-1" /> Retry
            </CButton>
          </div>
        </CAlert>
      </div>
    );
  }

  if (!busData) {
    return (
      <div className="container mt-4">
        <CAlert color="warning" className="d-flex align-items-center">
          <CIcon icon={cilInfo} className="me-2 flex-shrink-0" />
          <div>
            <h5>No bus data available</h5>
            <p className="mb-0">The requested bus information could not be found.</p>
          </div>
        </CAlert>
      </div>
    );
  }

  // Transform location data for MapboxMap
  const currentLocation = busData.currentLocation ? {
    latitude: busData.currentLocation.latitude,
    longitude: busData.currentLocation.longitude,
    speed: busData.currentLocation.speed,
    timestamp: busData.currentLocation.timestamp
  } : null;

  const trackingHistory = busData.trackingHistory?.map(track => ({
    location: {
      latitude: track.location.coordinates[1],
      longitude: track.location.coordinates[0]
    },
    speed: track.speed,
    timestamp: track.timestamp
  })) || [];

  const occupancyPercentage = calculateOccupancyPercentage();
  const occupancyColor = occupancyPercentage > 90 ? 'danger' : 
                       occupancyPercentage > 70 ? 'warning' : 'success';

  return (
    <div className="wrapper d-flex flex-column min-vh-100 bg-light">
      <AppSidebar />
      <div className="body flex-grow-1 px-3">
        <AppHeader />
        
        <CRow className="mb-4">
          <CCol xs={12}>
            <CCard className="bus-tracking-card shadow-sm">
              <CCardHeader className="d-flex justify-content-between align-items-center py-3">
                <div className="d-flex align-items-center">
                  <CIcon icon={cilTruck} className="me-3 text-primary" size="xl" />
                  <div>
                    <h4 className="mb-0">Bus Tracking - {busData.busNumber}</h4>
                    <div className="d-flex align-items-center mt-1">
                      <CBadge 
                        color={busData.status === 'active' ? 'success' : 'warning'} 
                        className="me-2"
                      >
                        {busData.status.toUpperCase()}
                      </CBadge>
                      <small className="text-muted">
                        Last updated: {formatTimestamp(lastRefresh)}
                      </small>
                    </div>
                  </div>
                </div>
                <div>
                  <CButton 
                    color="primary" 
                    onClick={handleManualRefresh}
                    className="d-flex align-items-center"
                  >
                    <CIcon icon={cilSync} className="me-2" />
                    Refresh
                  </CButton>
                </div>
              </CCardHeader>
              
              <CCardBody>
                {/* Delay Alert - Displayed prominently at the top */}
                {busData.delayInfo?.isDelayed && (
                  <CRow className="mb-4">
                    <CCol>
                      <CAlert color="warning" className="d-flex align-items-center py-3">
                        <CIcon icon={cilWarning} className="me-3 flex-shrink-0" size="xl" />
                        <div>
                          <h5 className="mb-2">Bus Delay Detected</h5>
                          <p className="mb-1">
                            <strong>Reason:</strong> {busData.delayInfo.reason || 'Not specified'}
                          </p>
                          {busData.delayInfo.duration && (
                            <p className="mb-0">
                              <strong>Duration:</strong> {formatTime(busData.delayInfo.duration)}
                            </p>
                          )}
                        </div>
                      </CAlert>
                    </CCol>
                  </CRow>
                )}

                <CRow>
                  {/* Left Column - Information Cards */}
                  <CCol md={4}>
                    {/* Bus Info Card */}
                    <CCard className="mb-4 shadow-sm">
                      <CCardHeader className="bg-primary text-white py-2">
                        <h5 className="mb-0">
                          <CIcon icon={cilTruck} className="me-2" />
                          Bus Information
                        </h5>
                      </CCardHeader>
                      <CCardBody>
                        <CListGroup flush>
                          <CListGroupItem className="d-flex justify-content-between align-items-center py-3">
                            <span className="text-muted">Bus Number:</span>
                            <strong>{busData.busNumber}</strong>
                          </CListGroupItem>
                          <CListGroupItem className="d-flex justify-content-between align-items-center py-3">
                            <span className="text-muted">Current Speed:</span>
                            <div className="d-flex align-items-center">
                              <strong>{currentLocation?.speed || 0} km/h</strong>
                              <CIcon icon={cilSpeedometer} className="ms-2 text-primary" />
                            </div>
                          </CListGroupItem>
                          <CListGroupItem className="d-flex justify-content-between align-items-center py-3">
                            <span className="text-muted">Last Update:</span>
                            <strong>
                              {currentLocation?.timestamp 
                                ? formatTimestamp(currentLocation.timestamp)
                                : 'N/A'}
                            </strong>
                          </CListGroupItem>
                          <CListGroupItem className="py-3">
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Passenger</span>
                              <strong>  {busData.capacity}</strong>
                            </div>
                          </CListGroupItem>
                        </CListGroup>
                      </CCardBody>
                    </CCard>

                    {/* Driver Info Card */}
                    {busData.driverId && (
                      <CCard className="mb-4 shadow-sm">
                        <CCardHeader className="bg-info text-white py-2">
                          <h5 className="mb-0">
                            <CIcon icon={cilUser} className="me-2" />
                            Driver Information
                          </h5>
                        </CCardHeader>
                        <CCardBody>
                          <CListGroup flush>
                            <CListGroupItem className="d-flex justify-content-between align-items-center py-3">
                              <span className="text-muted">Name:</span>
                              <strong>{busData.driverId.userId.name}</strong>
                            </CListGroupItem>
                            <CListGroupItem className="d-flex justify-content-between align-items-center py-3">
                              <span className="text-muted">License:</span>
                              <strong>{busData.driverId.licenseNumber}</strong>
                            </CListGroupItem>
                            <CListGroupItem className="d-flex justify-content-between align-items-center py-3">
                              <span className="text-muted">Contact:</span>
                              <strong>{busData.driverId?.userId?.phone || 'N/A'}</strong>
                            </CListGroupItem>
                          </CListGroup>
                        </CCardBody>
                      </CCard>
                    )}

                    {/* Route Info Card */}
                    {busData.routeId && (
                      <CCard className="shadow-sm">
                        <CCardHeader className="bg-success text-white py-2">
                          <h5 className="mb-0">
                            <CIcon icon={cilLocationPin} className="me-2" />
                            Route Information
                          </h5>
                        </CCardHeader>
                        <CCardBody>
                          <CListGroup flush>
                            <CListGroupItem className="d-flex justify-content-between align-items-center py-3">
                              <span className="text-muted">Route:</span>
                              <strong>{busData.routeId.routeName}</strong>
                            </CListGroupItem>
                            <CListGroupItem className="d-flex justify-content-between align-items-center py-3">
                              <span className="text-muted">Distance:</span>
                              <strong>{busData.routeId.totalDistance} km</strong>
                            </CListGroupItem>
                            <CListGroupItem className="d-flex justify-content-between align-items-center py-3">
                              <span className="text-muted">Duration:</span>
                              <strong>{formatTime(busData.routeId.estimatedDuration)}</strong>
                            </CListGroupItem>
                            <CListGroupItem className="d-flex justify-content-between align-items-center py-3">
                              <span className="text-muted">Stops:</span>
                              <strong>{busData.routeId.stops.length}</strong>
                            </CListGroupItem>
                          </CListGroup>
                        </CCardBody>
                      </CCard>
                    )}
                  </CCol>

                  {/* Right Column - Map and Stats */}
                  <CCol md={8}>
                    {/* Map Container */}
                    <div className="mb-4">
                      <CCard className="shadow-sm">
                        <CCardHeader className="bg-white py-2">
                          <h5 className="mb-0">
                            <CIcon icon={cilLocationPin} className="me-2 text-danger" />
                            Live Location Tracking
                          </h5>
                        </CCardHeader>
                        <CCardBody className="p-0" style={{ height: '400px' }}>
                          <MapboxMap
                            startLocation={busData.routeId?.startLocation}
                            endLocation={busData.routeId?.endLocation}
                            stops={busData.routeId?.stops}
                            busLocation={currentLocation}
                            busNumber={busData.busNumber}
                            passengerCount={busData.passengerCount || 0}
                            capacity={busData.capacity}
                            isDelayed={busData.delayInfo?.isDelayed}
                          />
                        </CCardBody>
                      </CCard>
                    </div>

                    {/* Stats Cards */}
                    <CRow>
                      <CCol md={6} className="mb-4">
                        <CCard className="h-100 shadow-sm">
                          <CCardHeader className="bg-white py-2">
                            <h5 className="mb-0">
                              <CIcon icon={cilSpeedometer} className="me-2 text-primary" />
                              Speed Statistics
                            </h5>
                          </CCardHeader>
                          <CCardBody className="text-center py-4">
                            <h2 className="display-4">
                              {currentLocation?.speed || 0} <small className="text-muted">km/h</small>
                            </h2>
                            <div className="mt-3">
                              <CBadge color="info" className="me-2">
                                Avg: 45 km/h
                              </CBadge>
                              <CBadge color="warning">
                                Max: 80 km/h
                              </CBadge>
                            </div>
                          </CCardBody>
                        </CCard>
                      </CCol>
                    </CRow>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </div>
    </div>
  );
};

export default BusTracking;