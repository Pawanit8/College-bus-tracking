import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CIcon from "@coreui/icons-react";
import { cilUser, cilPencil, cilTrash, cilPlus, cilSearch } from "@coreui/icons";
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
  CModalBody,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CAlert,
  CBadge,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CPagination,
  CPaginationItem,
  CTooltip
} from "@coreui/react";
import DriverForm from "./DriverForm";
import EditDriver from "./EditDriver";

const API_URL = import.meta.env.VITE_API_URL;

function DriverTable() {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState(null);
  const navigate = useNavigate();

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [busFilter, setBusFilter] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDrivers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/allDrivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrivers(response.data.drivers || []);
      setFilteredDrivers(response.data.drivers || []);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setError(err.response?.data?.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Apply filters whenever search term, bus filter or items per page changes
  useEffect(() => {
    let filtered = [...drivers];

    // Search by name or email
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(driver =>
        (driver.userId?.name && driver.userId.name.toLowerCase().includes(term)) ||
        (driver.userId?.email && driver.userId.email.toLowerCase().includes(term))
      );
    }

    // Filter by bus assignment
    if (busFilter !== 'all') {
      filtered = filtered.filter(driver => 
        busFilter === 'assigned' ? driver.busId : !driver.busId
      );
    }

    setFilteredDrivers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [drivers, searchTerm, busFilter]);

  // Get paginated data
  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);

  const handleDelete = async (driverId) => {
    if (!window.confirm("Are you sure you want to delete this driver?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required. Please log in.");
      return;
    }

    try {
      await axios.delete(`${API_URL}/deleteDriver/${driverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Driver deleted successfully");
      setTimeout(() => setSuccess(null), 5000);
      fetchDrivers();
    } catch (error) {
      console.error("Error deleting driver:", error);
      setError(error.response?.data?.message || "Failed to delete driver");
    }
  };

  const handleEdit = (driverId) => {
    setEditingDriverId(driverId);
  };

  const handleDriverUpdated = () => {
    setSuccess("Driver updated successfully");
    setTimeout(() => setSuccess(null), 5000);
    fetchDrivers();
    setEditingDriverId(null);
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4 shadow-sm">
          <CCardHeader className="d-flex justify-content-between align-items-center bg-light">
            <div>
              <CIcon icon={cilUser} className="me-2" />
              <strong>Driver Management</strong>
              {loading && <CSpinner color="primary" size="sm" className="ms-2" />}
            </div>
            <CButton onClick={() => setShowForm(true)} color="primary" size="sm">
              <CIcon icon={cilPlus} className="me-1" />
              Add Driver
            </CButton>
          </CCardHeader>

          {/* Filter controls - all in one row */}
          <CCardBody className="bg-light py-3">
            <CRow className="g-3 align-items-center">
              <CCol md={6}>
                <CInputGroup>
                  <CFormInput
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                </CInputGroup>
              </CCol>
              
              {/* <CCol md={3}>
                <CFormSelect 
                  value={busFilter} 
                  onChange={(e) => setBusFilter(e.target.value)}
                >
                  <option value="all">All Buses</option>
                  <option value="assigned">Assigned to Bus</option>
                  <option value="unassigned">Unassigned</option>
                </CFormSelect>
              </CCol> */}
              
              <CCol  md={4}>
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
            {error && (
              <CAlert color="danger" dismissible onClose={() => setError(null)}>
                {error}
              </CAlert>
            )}
            
            {success && (
              <CAlert color="success" dismissible onClose={() => setSuccess(null)}>
                {success}
              </CAlert>
            )}

            <div className="table-responsive">
              <CTable striped hover responsive className="align-middle">
                <CTableHead color="primary">
                  <CTableRow>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>License Number</CTableHeaderCell>
                    <CTableHeaderCell>Assigned Bus</CTableHeaderCell>
                    <CTableHeaderCell className="text-end ">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan="5" className="text-center py-5">
                        <CSpinner color="primary" />
                        <div className="mt-2">Loading drivers...</div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : paginatedDrivers.length > 0 ? (
                    paginatedDrivers.map((driver) => (
                      <CTableRow key={driver._id}>
                        <CTableDataCell>
                          <div className="fw-semibold">{driver.userId?.name || "N/A"}</div>
                        </CTableDataCell>
                        <CTableDataCell>
                          {driver.userId?.email ? (
                            <a href={`mailto:${driver.userId.email}`}>{driver.userId.email}</a>
                          ) : (
                            "N/A"
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {driver.licenseNumber || (
                            <span className="text-muted">Not provided</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {driver.busId ? (
                            <>
                              <span className="fw-semibold">{driver.busId.busNumber}</span>
                              {driver.busId.routeId && (
                                <small className="d-block text-muted">
                                  {driver.busId.routeId.routeName}
                                </small>
                              )}
                            </>
                          ) : (
                            <span className="text-muted">Not assigned</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <CTooltip content="Edit driver">
                              <CButton 
                                onClick={() => handleEdit(driver._id)} 
                                color="primary" 
                                size="sm" 
                              >
                                Edit
                              </CButton>
                            </CTooltip>
                            <CTooltip content="Delete driver">
                              <CButton 
                                onClick={() => handleDelete(driver._id)} 
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
                      <CTableDataCell colSpan="5" className="text-center py-5">
                        <CIcon icon={cilUser} size="xl" className="text-muted mb-2" />
                        <h5>No drivers found</h5>
                        <p className="text-muted">
                          {searchTerm || busFilter !== 'all' 
                            ? "Try adjusting your search or filters" 
                            : "No drivers available"}
                        </p>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </div>

            {/* Pagination */}
            {filteredDrivers.length > itemsPerPage && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredDrivers.length)} of{' '}
                  {filteredDrivers.length} drivers
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

      {/* Add Driver Modal */}
      <CModal visible={showForm} onClose={() => setShowForm(false)} size="lg">
        <CModalHeader closeButton>
          <CModalTitle>Add New Driver</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <DriverForm
            onDriverAdded={() => {
              setSuccess("Driver added successfully");
              setTimeout(() => setSuccess(null), 5000);
              fetchDrivers();
              setShowForm(false);
            }}
            onClose={() => setShowForm(false)}
          />
        </CModalBody>
      </CModal>

      {/* Edit Driver Modal */}
      <CModal visible={!!editingDriverId} onClose={() => setEditingDriverId(null)} size="lg">
        <CModalHeader closeButton>
          <CModalTitle>Edit Driver</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {editingDriverId && (
            <EditDriver
              driverId={editingDriverId}
              onDriverUpdated={handleDriverUpdated}
              onClose={() => setEditingDriverId(null)}
            />
          )}
        </CModalBody>
      </CModal>
    </CRow>
  );
}

export default DriverTable;