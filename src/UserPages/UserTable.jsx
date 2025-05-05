import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import CIcon from "@coreui/icons-react";
import {
  cilUser, cilSearch, cilPencil, cilTrash, cilPlus
} from "@coreui/icons";
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CRow, CTable,
  CTableBody, CTableHead, CTableHeaderCell, CTableRow, CTableDataCell,
  CModal, CModalHeader, CModalTitle, CModalBody,
  CFormInput, CInputGroup, CInputGroupText, CBadge, CSpinner,
  CFormSelect, CAlert, CTooltip, CPagination, CPaginationItem
} from '@coreui/react';
import UserForm from './UserForm';
import EditUser from './EditUser';

const API_URL = import.meta.env.VITE_API_URL;

function UserTable() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized: No token found. Please log in.");
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users || []);
      setFilteredUsers(response.data.users || []);
    } catch (err) {
      console.error("API Error:", err.response?.data);
      setError(err.response?.data?.message || "Failed to fetch users");
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized: No token found. Please log in.");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/auth/deleteUser/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(response.data.message || "User deleted successfully");
      setTimeout(() => setSuccess(null), 5000);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting user");
      if (err.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowEditForm(true);
  };

  const handleUserUpdated = () => {
    setSuccess("User updated successfully");
    setTimeout(() => setSuccess(null), 5000);
    fetchUsers();
    setShowEditForm(false);
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        (user.name?.toLowerCase().includes(term)) ||
        (user.email?.toLowerCase().includes(term)) ||
        (user.phone?.toLowerCase().includes(term))
      );
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, selectedRole]);

  // Get paginated data
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getUniqueRoles = () => {
    const roles = new Set(users.map(user => user.role));
    return ['all', ...Array.from(roles)].filter(Boolean);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4 shadow-sm">
          <CCardHeader className="d-flex justify-content-between align-items-center bg-light">
            <div>
              <CIcon icon={cilUser} className="me-2" />
              <strong>User Management</strong>
              {loading && <CSpinner color="primary" size="sm" className="ms-2" />}
            </div>
            <CButton onClick={() => setShowForm(true)} color="primary" size="sm">
              <CIcon icon={cilPlus} className="me-1" />
              Add User
            </CButton>
          </CCardHeader>

          <CCardBody className="bg-light py-3">
            <CRow className="g-3 align-items-center">
              <CCol md={6}>
                <CInputGroup>
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput
                    placeholder="Search by name, email or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </CInputGroup>
              </CCol>
              
              <CCol md={3}>
                <CFormSelect 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {getUniqueRoles().map(role => (
                    <option key={role} value={role}>
                      {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              
              <CCol md={3}>
                <CFormSelect
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value={15}>15 per page</option>
                  <option value={30}>30 per page</option>
                  <option value={50}>50 per page</option>
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
                    <CTableHeaderCell>Role</CTableHeaderCell>
                    <CTableHeaderCell>Phone</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan="5" className="text-center py-5">
                        <CSpinner color="primary" />
                        <div className="mt-2">Loading users...</div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <CTableRow key={user._id}>
                        <CTableDataCell>
                          <div className="fw-semibold">{user.name}</div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <a href={`mailto:${user.email}`}>{user.email}</a>
                        </CTableDataCell>
                        <CTableDataCell>
                          {user.role}
                        </CTableDataCell>
                        <CTableDataCell>
                          {user.phone || <span className="text-muted">N/A</span>}
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <CTooltip content="Edit user">
                              <CButton 
                                onClick={() => handleEdit(user)} 
                                color="primary" 
                                size="sm" 
                                
                              >
                                Edit
                              </CButton>
                            </CTooltip>
                            <CTooltip content="Delete user">
                              <CButton 
                                onClick={() => deleteUser(user._id)} 
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
                        <h5>No users found</h5>
                        <p className="text-muted">
                          {searchTerm || selectedRole !== 'all' 
                            ? "Try adjusting your search or filters" 
                            : "No users available"}
                        </p>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </div>

            {filteredUsers.length > itemsPerPage && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{' '}
                  {filteredUsers.length} users
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

      {/* Add User Modal */}
      <CModal visible={showForm} onClose={() => setShowForm(false)}>
        <CModalHeader closeButton>
          <CModalTitle>Add New User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <UserForm 
            onClose={() => {
              setShowForm(false);
              fetchUsers();
            }} 
            onSuccess={(message) => {
              setSuccess(message);
              setTimeout(() => setSuccess(null), 5000);
            }}
          />
        </CModalBody>
      </CModal>

      {/* Edit User Modal */}
      <CModal visible={showEditForm} onClose={() => setShowEditForm(false)} size="lg">
        <CModalHeader closeButton>
          <CModalTitle>Edit User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedUser && (
            <EditUser
              userId={selectedUser._id}
              initialData={selectedUser}
              onUserUpdated={handleUserUpdated}
              onClose={() => setShowEditForm(false)}
            />
          )}
        </CModalBody>
      </CModal>
    </CRow>
  );
}

export default UserTable;