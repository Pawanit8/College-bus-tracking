import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CSpinner,
  CBadge,
  CAlert,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CTooltip
} from "@coreui/react";
import { cilBusAlt, cilSearch, cilPlus, cilClock, cilLocationPin } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import BusForm from "./BusForm";
import EditBus from "./EditBus";

const API_URL = import.meta.env.VITE_API_URL;

const BusTable = () => {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBusId, setEditingBusId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // Filter and pagination state
  const [routeSearch, setRouteSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBuses = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized: Please log in.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/allBuses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Transform the API response to match expected structure
      const transformedBuses = response.data.data.map(bus => ({
        ...bus,
        _id: bus._id || bus.id, // Handle both _id and id cases
        driverId: bus.driverId || null, // Ensure driverId exists
        routeId: bus.routeId || null, // Ensure routeId exists
        lastUpdated: bus.updatedAt || bus.lastUpdated // Use updatedAt if available
      }));
      
      setBuses(transformedBuses);
      setFilteredBuses(transformedBuses);
    } catch (err) {
      console.error("Error fetching buses:", err);
      setError(err.response?.data?.message || "Failed to load buses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever search terms or status changes
  useEffect(() => {
    let filtered = [...buses];

    // Filter by route name
    if (routeSearch) {
      const term = routeSearch.toLowerCase();
      filtered = filtered.filter(bus => {
        const routeName = bus.routeId?.routeName || '';
        return routeName.toLowerCase().includes(term);
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bus => bus.status === statusFilter);
    }

    setFilteredBuses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [buses, routeSearch, statusFilter]);

  // Get paginated data
  const paginatedBuses = filteredBuses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredBuses.length / itemsPerPage);

  const handleDelete = async (busId) => {
    if (!window.confirm("Are you sure you want to delete this bus?")) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized: Please log in.");
      navigate("/login");
      return;
    }

    try {
      await axios.delete(`${API_URL}/deleteBus/${busId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Optimistic update
      setBuses(buses.filter(bus => bus._id !== busId));
      setSuccess("Bus deleted successfully");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Error deleting bus:", err);
      setError(err.response?.data?.message || "Failed to delete bus. Please try again.");
    }
  };

  const handleBusUpdated = () => {
    fetchBuses();
    setEditingBusId(null);
    setSuccess("Bus updated successfully");
    setTimeout(() => setSuccess(null), 5000);
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active": return <CBadge color="success">Active</CBadge>;
      case "maintenance": return <CBadge color="warning">Maintenance</CBadge>;
      case "inactive": return <CBadge color="secondary">Inactive</CBadge>;
      default: return <CBadge color="info">Unknown</CBadge>;
    }
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
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center bg-light">
            <div>
              <CIcon icon={cilBusAlt} className="me-2" />
              <strong>Bus Management</strong>
              {loading && <CSpinner color="primary" size="sm" className="ms-2" />}
            </div>
            <CButton onClick={() => setShowAddModal(true)} color="primary" size="sm">
              <CIcon icon={cilPlus} className="me-1" />
              Add Bus
            </CButton>
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
              <CCol md={6}>
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
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </CFormSelect>
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
                    <CTableHeaderCell>Bus Number</CTableHeaderCell>
                    <CTableHeaderCell>Capacity</CTableHeaderCell>
                    <CTableHeaderCell>Driver</CTableHeaderCell>
                    <CTableHeaderCell>Route</CTableHeaderCell>
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
                        <div className="mt-2">Loading buses...</div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : paginatedBuses.length > 0 ? (
                    paginatedBuses.map((bus) => (
                      <CTableRow key={bus._id}>
                        <CTableDataCell>{bus.busNumber}</CTableDataCell>
                        <CTableDataCell>{bus.capacity}</CTableDataCell>
                        <CTableDataCell>
                          {bus.driverId?.userId?.name || "Unassigned"}
                          {bus.driverId?.licenseNumber && (
                            <div className="small text-muted">
                              License: {bus.driverId.licenseNumber}
                            </div>
                          )}
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
                        <CTableDataCell>{getStatusBadge(bus.status)}</CTableDataCell>
                        <CTableDataCell>
                          <CIcon icon={cilClock} className="me-1" />
                          {getLastUpdated(bus.lastUpdated)}
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <CTooltip content="Edit bus">
                              <CButton 
                                onClick={() => setEditingBusId(bus._id)} 
                                color="primary" 
                                size="sm"
                              >
                                Edit
                              </CButton>
                            </CTooltip>
                            <CTooltip content="Delete bus">
                              <CButton 
                                onClick={() => handleDelete(bus._id)} 
                                color="danger" 
                                size="sm"
                              >
                                Delete
                              </CButton>
                            </CTooltip>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan="7" className="text-center py-5">
                        <CIcon icon={cilBusAlt} size="xl" className="text-muted mb-2" />
                        <h5>No buses found</h5>
                        <p className="text-muted">
                          {routeSearch || statusFilter !== 'all' 
                            ? "Try adjusting your search or filters" 
                            : "No buses available"}
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
                  {filteredBuses.length} buses
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

      {/* Add/Edit Bus Modals */}
      <CModal visible={showAddModal} onClose={() => setShowAddModal(false)} size="lg">
        <CModalHeader closeButton>
          <CModalTitle>Add New Bus</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <BusForm
            onBusAdded={() => {
              setSuccess("Bus added successfully");
              setTimeout(() => setSuccess(null), 5000);
              fetchBuses();
              setShowAddModal(false);
            }}
            onClose={() => setShowAddModal(false)}
          />
        </CModalBody>
      </CModal>

      <CModal visible={!!editingBusId} onClose={() => setEditingBusId(null)} size="lg">
        <CModalHeader closeButton>
          <CModalTitle>Edit Bus</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <EditBus
            busId={editingBusId}
            onBusUpdated={handleBusUpdated}
            onClose={() => setEditingBusId(null)}
          />
        </CModalBody>
      </CModal>
    </CRow>
  );
};

export default BusTable;