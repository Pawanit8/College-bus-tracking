import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CSpinner,
  CAlert,
  CButton,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CPagination,
  CFormSelect,
  CPaginationItem,
  CTooltip
} from "@coreui/react";
import { cilWarning, cilArrowLeft, cilClock, cilLocationPin, cilSearch } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import AppHeader from "../AppHeader";
import AppSidebar from "../AppSidebar";

const API_URL = import.meta.env.VITE_API_URL;

const DelayedBuses = () => {
  const [delayedBuses, setDelayedBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // Filter and pagination state
  const [routeSearch, setRouteSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDelayedBuses = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized: Please log in.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/dashboardData`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter and transform the API response
      const delayed = response.data.data.recentDelays
        .filter(bus => bus.delayInfo?.isDelayed)
        .map(bus => ({
          ...bus,
          _id: bus._id || bus.id,
          routeId: bus.routeId || null,
          lastUpdated: bus.updatedAt || bus.lastUpdated
        }));
      
      setDelayedBuses(delayed);
      setFilteredBuses(delayed);
    } catch (err) {
      console.error("Error fetching delayed buses:", err);
      setError(err.response?.data?.message || "Failed to load delayed buses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever search terms change
  useEffect(() => {
    let filtered = [...delayedBuses];

    // Filter by route name
    if (routeSearch) {
      const term = routeSearch.toLowerCase();
      filtered = filtered.filter(bus => {
        const routeName = bus.routeId?.routeName || '';
        return routeName.toLowerCase().includes(term);
      });
    }

    setFilteredBuses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [delayedBuses, routeSearch]);

  // Get paginated data
  const paginatedBuses = filteredBuses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredBuses.length / itemsPerPage);

  useEffect(() => {
    fetchDelayedBuses();
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getDelayDuration = (bus) => {
    if (!bus.delayInfo?.timestamp) return "N/A";
    const delayTime = new Date(bus.delayInfo.timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - delayTime) / (1000 * 60));
    return `${diffMinutes} min`;
  };

  const getLastUpdated = (timestamp) => {
    if (!timestamp) return "N/A";
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMinutes = Math.floor((now - updated) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  return (
    <CRow>
        <AppSidebar />
        <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center bg-light">
            <div>
              <CIcon icon={cilWarning} className="me-2" />
              <strong>Delayed Buses Management</strong>
              {loading && <CSpinner color="primary" size="sm" className="ms-2" />}
            </div>
            <div className="d-flex gap-2">
              <CButton color="light" variant="outline" onClick={() => navigate(-1)}>
                <CIcon icon={cilArrowLeft} className="me-1" />
                Back
              </CButton>
              <CButton color="primary" onClick={fetchDelayedBuses} disabled={loading}>
                {loading ? <CSpinner size="sm" /> : 'Refresh'}
              </CButton>
            </div>
          </CCardHeader>

          {error && (
            <CAlert color="danger" className="m-3" onClose={() => setError(null)}>
              {error}
            </CAlert>
          )}

          {success && (
            <CAlert color="success" className="m-3" onClose={() => setSuccess(null)}>
              {success}
            </CAlert>
          )}

          {/* Filter controls */}
          <CCardBody className="bg-light py-3">
            <CRow className="g-3 align-items-center">
              <CCol md={9}>
                <CInputGroup>
                  <CFormInput
                    placeholder="Search by route name..."
                    value={routeSearch}
                    onChange={(e) => setRouteSearch(e.target.value)}
                  />
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                </CInputGroup>
              </CCol>
              
              <CCol md={3}>
                <CFormSelect
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value={15}>15 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </CFormSelect>
              </CCol>
            </CRow>
          </CCardBody>

          <CCardBody>
            <div className="table-responsive">
              <CTable striped hover responsive>
                <CTableHead color="primary">
                  <CTableRow>
                    <CTableHeaderCell>Bus #</CTableHeaderCell>
                    <CTableHeaderCell>Route</CTableHeaderCell>
                    <CTableHeaderCell>Delay Reason</CTableHeaderCell>
                    <CTableHeaderCell>Duration</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Last Updated</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan="7" className="text-center py-5">
                        <CSpinner color="primary" />
                        <div className="mt-2">Loading delayed buses...</div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : paginatedBuses.length > 0 ? (
                    paginatedBuses.map((bus) => (
                      <CTableRow key={bus._id}>
                        <CTableDataCell>
                          <strong>{bus.busNumber}</strong>
                        </CTableDataCell>
                        <CTableDataCell>
                          {bus.routeId?.routeName || "Unassigned"}
                          {bus.routeId && (
                            <div className="small">
                              <CIcon icon={cilLocationPin} className="me-1" />
                              {bus.routeId.startLocation?.name || bus.routeId.startLocation} → 
                              {bus.routeId.endLocation?.name || bus.routeId.endLocation}
                            </div>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="warning">
                            {bus.delayInfo?.reason || "Unknown"}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>{getDelayDuration(bus)}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={bus.status === "active" ? "success" : "secondary"}>
                            {bus.status}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CIcon icon={cilClock} className="me-1" />
                          {getLastUpdated(bus.lastUpdated)}
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <CTooltip content="View bus details">
                            <CButton
                              color="info"
                              size="sm"
                              onClick={() => navigate(`/buses/${bus._id}`)}
                            >
                              View
                            </CButton>
                          </CTooltip>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan="7" className="text-center py-5">
                        <CIcon icon={cilWarning} size="xl" className="text-muted mb-2" />
                        <h5>No delayed buses found</h5>
                        <p className="text-muted">
                          {routeSearch 
                            ? "Try adjusting your search" 
                            : "No buses are currently delayed"}
                        </p>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </div>

            {/* Pagination */}
            {filteredBuses.length > itemsPerPage && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredBuses.length)} of{' '}
                  {filteredBuses.length} delayed buses
                </div>
                <CPagination>
                  <CPaginationItem 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(1)}
                  >
                    First
                  </CPaginationItem>
                  <CPaginationItem 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </CPaginationItem>
                  <CPaginationItem active>{currentPage}</CPaginationItem>
                  <CPaginationItem 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </CPaginationItem>
                  <CPaginationItem 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    Last
                  </CPaginationItem>
                </CPagination>
              </div>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    
    </div>
    </CRow>
  );
};

export default DelayedBuses;