import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  CRow, CCol, CCard, CCardHeader, CCardBody, CButton, CTable, CTableHead, 
  CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CModal, 
  CModalHeader, CModalTitle, CModalBody, CSpinner, CInputGroup,
  CInputGroupText, CFormInput, CFormSelect, CPagination, CPaginationItem,
  CTooltip, CAlert
} from "@coreui/react";
import { cilLocationPin, cilSearch, cilPencil, cilTrash, cilPlus } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import RouteForm from "./RouteForm";
import EditRoute from "./EditRoute";

const API_URL = import.meta.env.VITE_API_URL;

const RouteTable = () => {
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Filter and pagination state
  const [routeNameSearch, setRouteNameSearch] = useState('');
  const [busSearch, setBusSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRoutes = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized: Please log in.");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/allRoutes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoutes(response.data.routes || []);
      setFilteredRoutes(response.data.routes || []);
    } catch (error) {
      console.error("Error fetching routes:", error);
      setError("Failed to fetch routes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...routes];
    if (routeNameSearch) {
      filtered = filtered.filter(route => 
        route.routeName.toLowerCase().includes(routeNameSearch.toLowerCase())
      );
    }
    if (busSearch) {
      filtered = filtered.filter(route => 
        route.assignedBus?.busNumber?.toLowerCase().includes(busSearch.toLowerCase())
      );
    }
    setFilteredRoutes(filtered);
    setCurrentPage(1);
  }, [routes, routeNameSearch, busSearch]);

  // Pagination
  const paginatedRoutes = filteredRoutes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);

  const handleDelete = async (routeId) => {
    if (!window.confirm("Are you sure you want to delete this route?")) return;
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized: Please log in.");
      navigate("/login");
      return;
    }

    try {
      await axios.delete(`${API_URL}/deleteRoute/${routeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoutes(routes.filter(route => route._id !== routeId));
    } catch (error) {
      console.error("Error deleting route:", error);
      setError("Failed to delete route");
    }
  };

  const handleEdit = (route) => {
    setSelectedRoute(route);
    setShowEditForm(true);
  };

  const handleAddRoute = () => {
    setShowAddForm(true);
  };

  const closeAddForm = () => {
    setShowAddForm(false);
    fetchRoutes();
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setSelectedRoute(null);
    fetchRoutes();
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center bg-light">
            <div>
              <CIcon icon={cilLocationPin} className="me-2" />
              <strong>Route Management</strong>
              {loading && <CSpinner color="primary" size="sm" className="ms-2" />}
            </div>
            <CButton onClick={handleAddRoute} color="primary" size="sm">
              <CIcon icon={cilPlus} className="me-1" />
              Add Route
            </CButton>
          </CCardHeader>

          {error && (
            <CAlert color="danger" className="m-3">
              {error}
            </CAlert>
          )}

          <CCardBody className="bg-light py-3">
            <CRow className="g-3 align-items-center">
              <CCol md={6}>
                <CInputGroup>
                  <CFormInput
                    placeholder="Search by route name..."
                    value={routeNameSearch}
                    onChange={(e) => setRouteNameSearch(e.target.value)}
                  />
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                </CInputGroup>
              </CCol>
              
              <CCol md={3}>
                <CInputGroup>
                  <CFormInput
                    placeholder="Search by bus number..."
                    value={busSearch}
                    onChange={(e) => setBusSearch(e.target.value)}
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
                    <CTableHeaderCell>Route Name</CTableHeaderCell>
                    <CTableHeaderCell>Start Location</CTableHeaderCell>
                    <CTableHeaderCell>End Location</CTableHeaderCell>
                    <CTableHeaderCell>Stops</CTableHeaderCell>
                    <CTableHeaderCell>Distance (km)</CTableHeaderCell>
                    <CTableHeaderCell>Duration (mins)</CTableHeaderCell>
                    <CTableHeaderCell>Assigned Bus</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan="8" className="text-center py-5">
                        <CSpinner color="primary" />
                        <div className="mt-2">Loading routes...</div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : paginatedRoutes.length > 0 ? (
                    paginatedRoutes.map((route) => (
                      <CTableRow key={route._id}>
                        <CTableDataCell>{route.routeName}</CTableDataCell>
                        <CTableDataCell>{route.startLocation?.name || "N/A"}</CTableDataCell>
                        <CTableDataCell>{route.endLocation?.name || "N/A"}</CTableDataCell>
                        <CTableDataCell>
                          {route.stops?.map(stop => stop.name).join(", ") || "N/A"}
                        </CTableDataCell>
                        <CTableDataCell>{route.totalDistance}</CTableDataCell>
                        <CTableDataCell>{route.estimatedDuration}</CTableDataCell>
                        <CTableDataCell>
                          {route.assignedBus?.busNumber || (
                            <span className="text-muted">No Bus</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            
                              <CButton 
                                onClick={() => handleEdit(route)} 
                                color="primary" 
                                size="sm" 
                              >
                                
                                Edit
                              </CButton>
                            
                            
                              <CButton 
                                onClick={() => handleDelete(route._id)} 
                                color="danger" 
                                size="sm" 
                              >
                                
                                Delete
                              </CButton>
                            
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan="8" className="text-center py-5">
                        <CIcon icon={cilLocationPin} size="xl" className="text-muted mb-2" />
                        <h5>No routes found</h5>
                        <p className="text-muted">
                          {routeNameSearch || busSearch
                            ? "Try adjusting your search terms" 
                            : "No routes available"}
                        </p>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </div>

            {filteredRoutes.length > itemsPerPage && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredRoutes.length)} of{' '}
                  {filteredRoutes.length} routes
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

      {/* Add Route Modal */}
      <CModal 
        visible={showAddForm} 
        onClose={closeAddForm} 
        size="xl"
        backdrop="static"
      >
        <CModalHeader closeButton>
          <CModalTitle>Add New Route</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <RouteForm 
            onRouteAdded={closeAddForm}
            onClose={closeAddForm}
          />
        </CModalBody>
      </CModal>

      {/* Edit Route Modal */}
      <CModal 
        visible={showEditForm} 
        onClose={closeEditForm} 
        size="xl"
        backdrop="static"
      >
        <CModalHeader closeButton>
          <CModalTitle>Edit Route</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedRoute && (
            <EditRoute 
              onRouteUpdated={closeEditForm}
              onClose={closeEditForm}
              routeData={selectedRoute}
            />
          )}
        </CModalBody>
      </CModal>
    </CRow>
  );
};

export default RouteTable;