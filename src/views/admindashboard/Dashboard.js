import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CBadge,
  CAlert,
  CSpinner,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell
} from "@coreui/react";
import { Pie, Bar } from "react-chartjs-2";
import { cilTruck, cilUser, cilPeople, cilWarning, cilCheckCircle, cilLocationPin } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import "chart.js/auto";

const API_URL = import.meta.env.VITE_API_URL; 

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalBuses: 0,
    activeBuses: 0,
    delayedBuses: 0,
    totalUsers: 0,
    totalRoutes: 0,
    totalDrivers: 0,
    recentDelays: [],
    delayReports: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
     
      const response = await fetch(`${API_URL}/dashboardData`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setDashboardData(data.data || data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 600000); // Refresh every 10 minutes
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      value: dashboardData.totalBuses,
      label: "Total Buses",
      icon: cilTruck,
      onClick: () => navigate("/bustable"),
      bgColor: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
      hoverColor: "#5a0cb3"
    },
    {
      value: dashboardData.activeBuses,
      label: "Active Buses",
      icon: cilCheckCircle,
      bgColor: "linear-gradient(135deg, #28a745 0%, #5cb85c 100%)",
      hoverColor: "#218838"
    },
    {
      value: dashboardData.delayedBuses,
      label: "Delayed Buses",
      icon: cilWarning,
      onClick: () => navigate("/delayed-buses"),
      bgColor: "linear-gradient(135deg, #ff9f43 0%, #ffbe76 100%)",
      hoverColor: "#e69138"
    },
    {
      value: dashboardData.totalUsers,
      label: "Total Users",
      icon: cilUser,
      onClick: () => navigate("/usertable"),
      bgColor: "linear-gradient(135deg, #007bff 0%, #00b4db 100%)",
      hoverColor: "#0069d9"
    },
    {
      value: dashboardData.totalRoutes,
      label: "Total Routes",
      onClick: () => navigate("/routetable"),
      icon: cilLocationPin,
      bgColor: "linear-gradient(135deg, #6610f2 0%, #9b59b6 100%)",
      hoverColor: "#5a0cb3"
    },
    {
      value: dashboardData.totalDrivers,
      label: "Total Drivers",
      onClick: () => navigate("/drivertable"),
      icon: cilPeople,
      bgColor: "linear-gradient(135deg, #6c757d 0%, #95a5a6 100%)",
      hoverColor: "#5a6268"
    }
  ];

  const busUtilizationData = {
    labels: ["Active Buses", "Delayed Buses", "Inactive Buses"],
    datasets: [
      {
        data: [
          dashboardData.activeBuses, 
          dashboardData.delayedBuses,
          dashboardData.totalBuses - dashboardData.activeBuses - dashboardData.delayedBuses
        ],
        backgroundColor: ["#28a745", "#ff9f43", "#6c757d"],
        hoverBackgroundColor: ["#218838", "#e0a800", "#5a6268"],
        borderWidth: 1
      },
    ],
  };

  const systemDistributionData = {
    labels: ["Users", "Drivers", "Routes"],
    datasets: [
      {
        label: "System Distribution",
        data: [
          dashboardData.totalUsers, 
          dashboardData.totalDrivers, 
          dashboardData.totalRoutes
        ],
        backgroundColor: ["#007bff", "#6c757d", "#6610f2"],
        borderWidth: 1
      },
    ],
  };

  const formatDelayTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getDelayDuration = (timestamp) => {
    if (!timestamp) return "N/A";
    const delayTime = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - delayTime) / (1000 * 60));
    return `${diffMinutes} min`;
  };

  return (
    <div className="container-fluid">
      {loading && (
        <div className="text-center py-5">
          <CSpinner color="primary" />
          <p className="mt-2">Loading dashboard data...</p>
        </div>
      )}

      {error && (
        <CAlert color="danger" className="mb-4">
          {error}
          <CButton color="link" onClick={fetchDashboardData} className="p-0 ms-2">
            Try again
          </CButton>
        </CAlert>
      )}

      {!loading && !error && (
        <>
          {/* Stats Section */}
          <CRow className="mb-4 g-4">
            {stats.map((stat, index) => (
              <CCol sm={6} xl={4} key={index}>
                <CCard
                  className="text-center stat-card h-100"
                  style={{
                    background: stat.bgColor,
                    color: "#fff",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    border: "none",
                    cursor: stat.onClick ? "pointer" : "default"
                  }}
                  onClick={stat.onClick}
                >
                  <CCardBody className="d-flex flex-column justify-content-center">
                    <div className="d-flex justify-content-center mb-3">
                      <div style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <CIcon icon={stat.icon} size="xl" />
                      </div>
                    </div>
                    <h3 className="fw-bold mb-2">{stat.value}</h3>
                    <h5 className="fw-light mb-0">{stat.label}</h5>
                  </CCardBody>
                </CCard>
              </CCol>
            ))}
          </CRow>

          {/* Charts Section */}
          <CRow className="g-4">
            <CCol xl={6}>
              <CCard className="h-100">
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Bus Status Distribution</span>
                  <CBadge color="info">
                    Total: {dashboardData.totalBuses}
                  </CBadge>
                </CCardHeader>
                <CCardBody>
                  <Pie 
                    data={busUtilizationData} 
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom'
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const value = context.raw;
                              const percentage = Math.round((value / total) * 100);
                              return `${context.label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </CCardBody>
              </CCard>
            </CCol>
            <CCol xl={6}>
              <CCard className="h-100">
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">System Distribution</span>
                </CCardHeader>
                <CCardBody>
                  <Bar 
                    data={systemDistributionData}
                    options={{
                      responsive: true,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }}
                  />
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* Delayed Buses Section */}
          {dashboardData.recentDelays?.filter(bus => bus.delayInfo?.isDelayed).length > 0 && (
            <CRow className="mt-4">
              <CCol>
                <CCard>
                  <CCardHeader className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <CIcon icon={cilWarning} className="me-2" />
                      <span className="fw-bold">Currently Delayed Buses</span>
                      <CBadge color="warning" className="ms-2">
                        {dashboardData.recentDelays.filter(bus => bus.delayInfo?.isDelayed).length}
                      </CBadge>
                    </div>
                    <CButton 
                      color="primary" 
                      size="sm"
                      onClick={() => navigate("/delayed-buses")}
                    >
                      View All
                    </CButton>
                  </CCardHeader>
                  <CCardBody>
                    <CTable hover responsive>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Bus #</CTableHeaderCell>
                          <CTableHeaderCell>Route</CTableHeaderCell>
                          <CTableHeaderCell>Delay Reason</CTableHeaderCell>
                          <CTableHeaderCell>Duration</CTableHeaderCell>
                          <CTableHeaderCell>Last Update</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {dashboardData.recentDelays
                          .filter(bus => bus.delayInfo?.isDelayed)
                          .slice(0, 5) // Show only first 5 delayed buses
                          .map((bus, index) => (
                            <CTableRow key={index}>
                              <CTableDataCell>{bus.busNumber}</CTableDataCell>
                              <CTableDataCell>{bus.routeId?.routeName || 'N/A'}</CTableDataCell>
                              <CTableDataCell>
                                <CBadge color="warning">
                                  {bus.delayInfo?.reason || 'Unknown'}
                                </CBadge>
                              </CTableDataCell>
                              <CTableDataCell>
                                {getDelayDuration(bus.delayInfo?.timestamp)}
                              </CTableDataCell>
                              <CTableDataCell>
                                {formatDate(bus.updatedAt)} {formatDelayTime(bus.updatedAt)}
                              </CTableDataCell>
                            </CTableRow>
                          ))}
                      </CTableBody>
                    </CTable>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          )}

          {/* Refresh Button */}
          <CRow className="mt-4">
            <CCol className="text-center">
              <CButton 
                color="primary" 
                onClick={fetchDashboardData}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CSpinner component="span" size="sm" aria-hidden="true" />
                    <span className="ms-2">Refreshing...</span>
                  </>
                ) : (
                  "Refresh Data"
                )}
              </CButton>
            </CCol>
          </CRow>
        </>
      )}
    </div>
  );
};

export default Dashboard;