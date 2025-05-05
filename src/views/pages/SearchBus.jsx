import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  CContainer,
  CFormInput,
  CButton,
  CAlert,
  CRow,
  CCol,
  CFormCheck,
  CCard,
  CCardBody,
  CCardHeader,
  CBadge,
  CProgress,
  CSpinner,
  CTooltip,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormTextarea
} from "@coreui/react";
import { 
  cilLocationPin, 
  cilSpeedometer, 
  cilArrowThickRight, 
  cilVolumeHigh, 
  cilVolumeOff, 
  cilClock, 
  cilWarning,
  cilInfo,
  cilCheckCircle,
  cilTruck,
  cilArrowCircleBottom,
  cilArrowCircleTop,
  cilReload,
  cilMap,
  cilStar
} from '@coreui/icons';
import axios from "axios";
import MapboxMap from "../../components/MapboxMap";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { 
  FaBus, 
  FaVolumeUp, 
  FaVolumeMute, 
  FaSync, 
  FaSearch,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaRoute,
  FaInfoCircle
} from "react-icons/fa";
import { 
  MdDirectionsBus,
  MdTimer,
  MdLocationOn,
  MdDirections
} from "react-icons/md";
import CIcon from "@coreui/icons-react";
import { WiDaySunny, WiRain, WiCloudy } from "react-icons/wi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Rating from "react-rating-stars-component";

const API_URL = import.meta.env.VITE_API_URL;

const SearchBus = () => {
  // State management
  const [busNumber, setBusNumber] = useState("");
  const stopsListRef = useRef(null);
  const [busInfo, setBusInfo] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(300);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [countdownInterval, setCountdownInterval] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [nextStopIndex, setNextStopIndex] = useState(1);
  const [currentInstruction, setCurrentInstruction] = useState("");
  const [eta, setEta] = useState(null);
  const [distanceToNextStop, setDistanceToNextStop] = useState(0);
  const [passengerCount, setPassengerCount] = useState(0);
  const [weatherData, setWeatherData] = useState(null);
  const [delayInfo, setDelayInfo] = useState(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [routeProgress, setRouteProgress] = useState(0);
  const [stopETAs, setStopETAs] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busMarkerPosition, setBusMarkerPosition] = useState(null);
  const [interpolatedPosition, setInterpolatedPosition] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    rating: 0,
  });

  // Helper functions
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }, []);

  const formatTime = useCallback((minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m`;
  }, []);

  const calculateRouteProgress = useCallback(() => {
    if (!busLocation || routePoints.length === 0) return 0;
    
    let totalDistance = 0;
    let traveledDistance = 0;
    
    // Calculate total route distance
    for (let i = 1; i < routePoints.length; i++) {
      totalDistance += calculateDistance(
        routePoints[i-1].latitude,
        routePoints[i-1].longitude,
        routePoints[i].latitude,
        routePoints[i].longitude
      );
    }
    
    // Calculate distance traveled so far
    for (let i = 1; i <= currentStopIndex; i++) {
      traveledDistance += calculateDistance(
        routePoints[i-1].latitude,
        routePoints[i-1].longitude,
        routePoints[i].latitude,
        routePoints[i].longitude
      );
    }
    
    // Add distance from last stop to current location
    if (currentStopIndex < routePoints.length - 1) {
      traveledDistance += calculateDistance(
        routePoints[currentStopIndex].latitude,
        routePoints[currentStopIndex].longitude,
        busLocation.latitude,
        busLocation.longitude
      );
    }
    
    return Math.min(100, Math.round((traveledDistance / totalDistance) * 100));
  }, [busLocation, routePoints, currentStopIndex, calculateDistance]);

  const calculateETAs = useCallback(() => {
    if (!busLocation || !routePoints || routePoints.length === 0) return {};
  
    const currentTime = new Date();
    const etas = {};
    let cumulativeTime = 0;
    const avgSpeed = busLocation?.speed > 0 ? busLocation.speed : 30; // Default to 30 km/h if speed is 0
  
    // Calculate ETAs for all stops including the end location
    for (let i = nextStopIndex; i < routePoints.length; i++) {
      const prevPoint = i === nextStopIndex ? 
        { latitude: busLocation.latitude, longitude: busLocation.longitude } : 
        routePoints[i - 1];
      
      const distance = calculateDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        routePoints[i].latitude,
        routePoints[i].longitude
      );
      
      const timeInHours = distance / avgSpeed;
      cumulativeTime += timeInHours * 60;
      
      etas[i] = {
        minutes: Math.round(cumulativeTime),
        arrivalTime: new Date(currentTime.getTime() + cumulativeTime * 60000),
        distance: distance.toFixed(2)
      };
    }
  
    return etas;
  }, [busLocation, routePoints, nextStopIndex, calculateDistance]);

  const updateNextStopIndex = useCallback((location, points) => {
    if (!location || !points.length) return;
    
    for (let i = 1; i < points.length; i++) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        points[i].latitude,
        points[i].longitude
      );
      
      if (distance > 0.1) {
        setNextStopIndex(i);
        return;
      }
    }
    
    setNextStopIndex(points.length - 1);
  }, [calculateDistance]);

  const interpolatePosition = useCallback((prevPos, newPos, duration = 5000) => {
    if (!prevPos || !newPos) return;
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / duration);
      
      if (progress >= 1) {
        setInterpolatedPosition(null);
        return;
      }
      
      const lat = prevPos.latitude + (newPos.latitude - prevPos.latitude) * progress;
      const lng = prevPos.longitude + (newPos.longitude - prevPos.longitude) * progress;
      
      setInterpolatedPosition({
        latitude: lat,
        longitude: lng,
        speed: newPos.speed,
        timestamp: newPos.timestamp
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, []);

  const fetchBusDetailsAndLocation = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/searchBus/${busNumber}`);
      if (res.data.success) {
        const { data } = res.data;
        const { routeId, currentLocation, delayInfo } = data;

        const points = [  
          { ...routeId.startLocation, type: 'start' },
          ...(routeId.stops || []).map(stop => ({ ...stop, type: 'stop' })),
          { ...routeId.endLocation, type: 'end' }
        ];
        
        setRoutePoints(points);
        setNextStopIndex(1);
        setDelayInfo(delayInfo);

        setBusInfo({
          _id: data._id,
          busNumber: data.busNumber,
          capacity: data.capacity,
          startLocation: routeId.startLocation,
          endLocation: routeId.endLocation,
          stops: routeId.stops,
          routeName: routeId.routeName,
          isReturnTrip: data.isReturnTrip,
          status: data.status,
          driverId: data.driverId
        });

        if (currentLocation) {
          const locationData = {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            speed: currentLocation.speed,
            timestamp: currentLocation.timestamp
          };
          
          if (busLocation) {
            interpolatePosition(busLocation, locationData);
          }
          
          setBusLocation(locationData);
          setBusMarkerPosition(locationData);
          updateNextStopIndex(locationData, points);
          
          for (let i = 0; i < points.length - 1; i++) {
            const distance = calculateDistance(
              locationData.latitude,
              locationData.longitude,
              points[i].latitude,
              points[i].longitude
            );
            if (distance < 0.1) {
              setCurrentStopIndex(i);
              break;
            }
          }
        }

        setPassengerCount(Math.floor(Math.random() * data.capacity));
        setLastUpdateTime(new Date());
        toast.success(`Successfully tracking bus ${data.busNumber}`);
      } else {
        setError("Bus not found");
        toast.error("Bus not found");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.message || "Error fetching bus details");
      toast.error(err.response?.data?.message || "Error fetching bus details");
    } finally {
      setIsLoading(false);
    }
  }, [busNumber, updateNextStopIndex, calculateDistance, busLocation, interpolatePosition]);

  const startAutoRefresh = useCallback(() => {
    clearInterval(refreshInterval);
    clearInterval(countdownInterval);

    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBusDetailsAndLocation();
      setCountdown(300);
    }, 300000);

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    setRefreshInterval(interval);
    setCountdownInterval(countdownTimer);

    return () => {
      clearInterval(interval);
      clearInterval(countdownTimer);
    };
  }, [autoRefresh, fetchBusDetailsAndLocation]);

  const handleSearch = useCallback(async () => {
    if (!busNumber.trim()) {
      setError("Please enter a bus number");
      toast.warning("Please enter a bus number");
      return;
    }
    await fetchBusDetailsAndLocation();
    setCountdown(300);
    startAutoRefresh();
  }, [busNumber, fetchBusDetailsAndLocation, startAutoRefresh]);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchBusDetailsAndLocation();
    setCountdown(300);
    setIsRefreshing(false);
  }, [fetchBusDetailsAndLocation]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
    toast.info(`Voice navigation ${!voiceEnabled ? 'enabled' : 'disabled'}`);
  }, [voiceEnabled]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
    toast.info(`Auto refresh ${!autoRefresh ? 'enabled' : 'disabled'}`);
  }, [autoRefresh]);

  const getWeatherIcon = useCallback((weather) => {
    switch(weather?.toLowerCase()) {
      case 'clear': return <WiDaySunny size={48} className="text-warning" />;
      case 'rain': return <WiRain size={48} className="text-info" />;
      default: return <WiCloudy size={48} className="text-secondary" />;
    }
  }, []);

  const getCapacityPercentage = useCallback(() => {
    return busInfo ? Math.min(100, (passengerCount / busInfo.capacity) * 100) : 0;
  }, [busInfo, passengerCount]);

  const handleFeedbackChange = (e) => {
    setFeedbackData({ ...feedbackData, [e.target.name]: e.target.value });
  };

  const handleRatingChange = (newRating) => {
    setFeedbackData({ ...feedbackData, rating: newRating });
  };

  

  // Effects
  useEffect(() => {
    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [refreshInterval, countdownInterval]);

  useEffect(() => {
    if (busLocation && routePoints.length > 0) {
      const etas = calculateETAs();
      setStopETAs(etas);
      setRouteProgress(calculateRouteProgress());
      
      if (etas[routePoints.length - 1]) {
        setEta(etas[routePoints.length - 1].minutes);
      }
    }
  }, [busLocation, routePoints, nextStopIndex, currentStopIndex, calculateETAs, calculateRouteProgress]);

  useEffect(() => {
    if (stopsListRef.current && currentStopIndex > 0) {
      const stopElement = stopsListRef.current.children[currentStopIndex];
      if (stopElement) {
        stopElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStopIndex]);

  const renderRouteStops = () => {
    return (
      <div className="route-progress-container">
        <div className="route-progress-line"></div>
        <div className="route-stops-list" ref={stopsListRef}>
          {routePoints.map((point, index) => (
            <div 
              key={index} 
              className={`route-stop ${index === currentStopIndex ? 'current' : ''} ${index < currentStopIndex ? 'passed' : ''}`}
            >
              <div className="stop-marker">
                {index === 0 && <CIcon icon={cilArrowCircleTop} className="text-success" />}
                {index === routePoints.length - 1 && <CIcon icon={cilArrowCircleBottom} className="text-danger" />}
                {index > 0 && index < routePoints.length - 1 && (
                  <div className={`stop-dot ${index === currentStopIndex ? 'current-dot' : ''}`}></div>
                )}
              </div>
              <div className="stop-details">
                <div className="stop-name">
                  <strong>{point.name}</strong>
                  {index === currentStopIndex && (
                    <CBadge color="success" className="ms-2">Current</CBadge>
                  )}
                </div>
                <div className="stop-time">
                  {point.time && (
                    <small>
                      <strong>Scheduled: </strong>{point.time}
                    </small>
                  )}
                  {stopETAs[index] && (
                    <>
                      {point.time && <br />}
                      <small>
                        <strong>Estimated: </strong>
                        {stopETAs[index].arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {` (${stopETAs[index].minutes} min)`}
                      </small>
                    </>
                  )}
                </div>
                {stopETAs[index]?.distance && (
                  <div className="stop-distance">
                    <small>
                      <strong>Distance: </strong>
                      {stopETAs[index].distance} km
                    </small>
                  </div>
                )}
              </div>
              {index < routePoints.length - 1 && (
                <div className="stop-connector"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBusInfoHeader = () => (
    <CRow className="mb-4">
      <CCol>
        <CCard className="shadow-sm border-0">
          <CCardBody className="bg-white rounded">
            <CRow className="align-items-center">
              <CCol md={4} className="border-end">
                <div className="d-flex align-items-center">
                  <MdDirectionsBus size={32} className="text-primary me-3" />
                  <div>
                    <h4 className="mb-0">Bus {busInfo.busNumber}</h4>
                    <small className="text-muted">{busInfo.routeName}</small>
                    <div className="small text-muted">
                      Driver: {busInfo.driverId?.userId?.name || 'Not assigned'}
                    </div>
                  </div>
                </div>
              </CCol>
              <CCol md={4} className="border-end">
                <div className="d-flex flex-column">
                  <div>
                    <strong className="text-muted">Next Stop:</strong>
                    {routePoints[nextStopIndex]?.name || 'Terminus'}
                    {stopETAs[nextStopIndex] && (
                      <strong className="text-muted">
                        <br/>
                        Arrival to nextstop: {formatTime(stopETAs[nextStopIndex].minutes)}
                      </strong>
                    )}
                  </div>
                </div>
              </CCol>
              <CCol md={4}>
                <div className="d-flex flex-column">
                  <div className="d-flex justify-content-between mb-1">
                    <strong className="text-muted">Status</strong>
                    <CBadge color={busInfo.status === 'active' ? 'success' : 'warning'}>
                      {busInfo.status}
                    </CBadge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <strong className="text-muted">Last Update</strong>
                    <small>
                      {lastUpdateTime?.toLocaleTimeString() || 'N/A'}
                    </small>
                  </div>
                </div>
              </CCol>
            </CRow>
            {delayInfo?.isDelayed && (
              <CRow className="mt-2">
                <CCol>
                  <CAlert color="warning" className="py-1 mb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <CIcon icon={cilWarning} className="me-2" />
                        <strong>Delay Notice:</strong> {delayInfo.reason} ({formatTime(delayInfo.duration)})
                      </div>
                      <small>
                        {new Date(delayInfo.timestamp).toLocaleTimeString()}
                      </small>
                    </div>
                  </CAlert>
                </CCol>
              </CRow>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* Search Section */}
      <div className="py-4 bg-primary text-white position-relative overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 90%, 0 100%)',
          height: '300px'
        }}>
        <div className="position-absolute w-100 h-100" style={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          zIndex: 1
        }}></div>
        <CContainer className="position-relative" style={{ zIndex: 2 }}>
          <h2 className="mb-3 text-center">Track Your Bus</h2>
          <CRow className="justify-content-center">
            <CCol xs={12} md={8} lg={6}>
              <div className="d-flex gap-2">
                <CFormInput
                  placeholder="Enter Bus Number (e.g., B101)"
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-grow-1"
                />
                <CButton 
                  color="light" 
                  onClick={handleSearch}
                  className="text-primary"
                >
                  <FaSearch className="me-1" /> Track
                </CButton>
              </div>
              {error && (
                <CAlert color="danger" className="mt-2 fade show">
                  <FaInfoCircle className="me-2" />
                  {error}
                </CAlert>
              )}
            </CCol>
          </CRow>
        </CContainer>
      </div>

      <main className="flex-grow-1 py-4">
        <CContainer>
          {isLoading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" size="lg" />
              <p className="mt-3">Locating bus {busNumber}...</p>
            </div>
          ) : busInfo ? (
            <>
              {renderBusInfoHeader()}

              <CRow>
                <CCol md={4}>
                  <CCard className="mb-4 shadow-sm">
                    <CCardHeader className="bg-white">
                      <h6 className="mb-0">
                        <FaRoute className="me-2 text-primary" /> Route Progress ({routeProgress}%)
                      </h6>
                    </CCardHeader>
                    <CCardBody>
                      <CProgress className="mb-3" color="primary" value={routeProgress} />
                      {renderRouteStops()}
                    </CCardBody>
                  </CCard>

                  {weatherData && (
                    <CCard className="mb-4 shadow-sm">
                      <CCardHeader className="bg-white">
                        <h6 className="mb-0">
                          {getWeatherIcon(weatherData.weather[0].main)}
                          <span className="ms-2">Weather</span>
                        </h6>
                      </CCardHeader>
                      <CCardBody>
                        <div className="d-flex justify-content-between">
                          <div>
                            <h5>{weatherData.main.temp}°C</h5>
                            <p className="mb-1">{weatherData.weather[0].description}</p>
                          </div>
                          <div className="text-end">
                            <p className="mb-1">Humidity: {weatherData.main.humidity}%</p>
                            <p className="mb-0">Wind: {weatherData.wind.speed} m/s</p>
                          </div>
                        </div>
                      </CCardBody>
                    </CCard>
                  )}

                  <CCard className="shadow-sm">
                    <CCardHeader className="bg-white">
                      <h6 className="mb-0">
                        <FaInfoCircle className="me-2 text-primary" /> Controls
                      </h6>
                    </CCardHeader>
                    <CCardBody>
                      <div className="d-flex flex-column gap-3">
                        <CFormCheck
                          label={
                            <>
                              <CIcon icon={voiceEnabled ? cilVolumeHigh : cilVolumeOff} className="me-2" />
                              Voice Navigation {voiceEnabled ? '(ON)' : '(OFF)'}
                            </>
                          }
                          checked={voiceEnabled}
                          onChange={toggleVoice}
                        />
                        <CFormCheck
                          label={
                            <>
                              <CIcon icon={cilClock} className="me-2" />
                              Auto Refresh {autoRefresh ? '(ON)' : '(OFF)'}
                            </>
                          }
                          checked={autoRefresh}
                          onChange={toggleAutoRefresh}
                        />
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>

                <CCol md={8}>
                  <CCard className="h-100 shadow-sm">
                    <CCardHeader className="bg-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">
                          <CIcon icon={cilMap} className="me-2 text-primary" /> Live Route Map
                        </h6>
                        <div>
                          <CBadge color="info" className="me-2">
                            {formatTime(countdown)}
                          </CBadge>
                          <CButton 
                            size="sm" 
                            color="outline-primary" 
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                          >
                            <CIcon icon={cilReload} spin={isRefreshing} className="me-1" /> Refresh
                          </CButton>
                        </div>
                      </div>
                    </CCardHeader>
                    <CCardBody className="p-0" style={{ height: '600px' }}>
                      <MapboxMap
                        startLocation={busInfo.startLocation}
                        endLocation={busInfo.endLocation}
                        stops={busInfo.stops}
                        busLocation={interpolatedPosition || busMarkerPosition}
                        enableVoice={voiceEnabled}
                        routePoints={routePoints}
                        nextStopIndex={nextStopIndex}
                        onInstructionChange={setCurrentInstruction}
                        onEtaChange={setEta}
                        onDistanceChange={setDistanceToNextStop}
                        busNumber={busInfo.busNumber}
                        passengerCount={passengerCount}
                        capacity={busInfo.capacity}
                        isReturnTrip={busInfo.isReturnTrip}
                      />
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>

              {currentInstruction && (
                <CRow className="mt-4">
                  <CCol>
                    <CCard className="shadow-sm border-info">
                      <CCardHeader className="bg-info text-white">
                        <h6 className="mb-0">
                          <CIcon icon={cilArrowThickRight} className="me-2" /> Navigation Instruction
                        </h6>
                      </CCardHeader>
                      <CCardBody>
                        <div className="d-flex align-items-center">
                          <CIcon icon={cilArrowThickRight} className="me-3 text-info" size="xl" />
                          <div>
                            <h5 className="mb-1">{currentInstruction}</h5>
                            {eta && (
                              <small className="text-muted">
                                Arriving in ~{formatTime(eta)} to {routePoints[routePoints.length - 1].name}
                              </small>
                            )}
                          </div>
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                </CRow>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <FaBus size={64} className="text-primary mb-3" />
              <h3>Track Your Bus in Real-Time</h3>
              <p className="text-muted mb-4">
                Enter a bus number above to view its current location, route, and other details
              </p>
              
            </div>
          )}
        </CContainer>
      </main>

      
      

      <Footer />

      <style jsx>{`
        .route-progress-container {
          position: relative;
          padding-left: 20px;
        }
        
        .route-progress-line {
          position: absolute;
          left: 9px;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: #007bff;
          z-index: 1;
        }
        
        .route-stops-list {
          position: relative;
          z-index: 2;
          max-height: 500px;
          overflow-y: auto;
          padding-right: 10px;
        }
        
        .route-stop {
          display: flex;
          flex-direction: column;
          margin-bottom: 15px;
          position: relative;
          transition: all 0.3s ease;
        }
        
        .stop-marker {
          position: absolute;
          left: -20px;
          width: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 3;
        }
        
        .stop-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #007bff;
          border: 2px solid white;
          transition: all 0.3s ease;
        }
        
        .stop-dot.current-dot {
          background-color: #28a745;
          transform: scale(1.3);
          box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.5);
          animation: pulse 1.5s infinite;
        }
        
        .route-stop.passed .stop-dot {
          background-color: #6c757d;
        }
        
        .stop-details {
          margin-left: 10px;
          padding: 8px 12px;
          background-color: #f8f9fa;
          border-radius: 4px;
          border-left: 3px solid #007bff;
          transition: all 0.3s ease;
        }
        
        .route-stop.current .stop-details {
          background-color: #e2f0ff;
          border-left-color: #28a745;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .route-stop.passed .stop-details {
          background-color: #f8f9fa;
          border-left-color: #6c757d;
        }
        
        .stop-connector {
          height: 15px;
          width: 2px;
          background-color: #dee2e6;
          margin-left: 4px;
          transition: all 0.3s ease;
        }
        
        .route-stop:last-child .stop-connector {
          display: none;
        }
        
        .stop-name .badge {
          font-size: 12px;
        }
        
        .stop-distance {
          font-size: 12px;
          color: #6c757d;
          margin-top: 4px;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default SearchBus;