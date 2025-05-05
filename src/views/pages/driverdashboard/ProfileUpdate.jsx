import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CFormLabel,
  CButton,
  CAlert,
  CSpinner,
  CCard,
  CCardBody,
  CCardHeader,
  CImage,
  CRow,
  CCol,
  CFormText,
  CInputGroup,
  CInputGroupText
} from '@coreui/react';
import { cilPencil, cilUser, cilPhone, cilCalendar, cilLockLocked } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import Navbar from "./Navbar";
import avatar8 from "../../../../src/assets/images/avatars/8.jpg";

const API_URL = import.meta.env.VITE_API_URL;

const ProfileUpdates = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: '',
    phone: '',
    gender: '',
    dob: '',
    age: ''
  });
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/auth/user/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (data.success) {
          setUser({
            name: data.user.name || '',
            phone: data.user.phone || '',
            gender: data.user.gender || '',
            dob: data.user.dob ? new Date(data.user.dob).toISOString().split('T')[0] : '',
            age: data.user.age || ''
          });
          setEmail(data.user.email || '');
          // Use profilePictureUrl directly if available, otherwise construct URL
          if (data.user.profilePictureUrl) {
            setPreviewImage(data.user.profilePictureUrl);
          } else if (data.user.profilePicture) {
            setPreviewImage(`${API_URL}${data.user.profilePicture}`);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch user details');
      } finally {
        setFetching(false);
      }
    };
    fetchUserDetails();
  }, [navigate]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
      setProfilePicture(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      Object.entries(user).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      if (profilePicture instanceof File) {
        formData.append('profilePicture', profilePicture);
      }

      const { data } = await axios.put(`${API_URL}/updateProfile`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        if (data.user.role === 'driver') {
          navigate('/driver-dashboard');
        } else if (data.user.role === 'Admin') {
          navigate('/dashboard');
        } else {
          navigate('/student-dashboard');
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />
      <main className="flex-grow-1 py-4">
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={8} lg={6}>
              <CCard className="shadow-sm border-0">
                <CCardHeader className="bg-white border-0 py-3">
                  <h3 className="mb-0 text-center text-primary fw-bold">Update Your Profile</h3>
                </CCardHeader>
                <CCardBody className="p-4">
                  {error && <CAlert color="danger" dismissible onClose={() => setError('')}>{error}</CAlert>}
                  {success && <CAlert color="success" dismissible onClose={() => setSuccess('')}>{success}</CAlert>}

                  <CForm onSubmit={handleSubmit} className="needs-validation">
                    <div className="text-center mb-4">
                      <div className="position-relative d-inline-block">
                        <CImage
                          rounded
                          thumbnail
                          src={previewImage || avatar8}  
                          width={150}
                          height={150}
                          className="border border-3 border-primary"
                          style={{ objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = avatar8;
                          }}
                        />
                        <CFormInput
                          type="file"
                          id="profilePicture"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="d-none"
                        />
                        <CButton
                          color="primary"
                          shape="rounded-pill"
                          size="sm"
                          className="position-absolute bottom-0 end-0 shadow-sm"
                          onClick={() => document.getElementById('profilePicture').click()}
                        >
                          <CIcon icon={cilPencil} className="me-1" />
                          Edit
                        </CButton>
                      </div>
                      <CFormText className="d-block text-muted mt-2">JPG, PNG up to 2MB</CFormText>
                    </div>

                    <div className="mb-3">
                      <CFormLabel className="fw-semibold">Email</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput 
                          type="text" 
                          value={email} 
                          readOnly 
                          className="bg-light"
                        />
                      </CInputGroup>
                    </div>

                    <div className="mb-3">
                      <CFormLabel htmlFor="name" className="fw-semibold">
                        Full Name <span className="text-danger">*</span>
                      </CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilUser} />
                        </CInputGroupText>
                        <CFormInput
                          id="name"
                          name="name"
                          value={user.name}
                          onChange={handleChange}
                          required
                          placeholder="Enter your full name"
                        />
                      </CInputGroup>
                    </div>

                    <div className="mb-3">
                      <CFormLabel htmlFor="phone" className="fw-semibold">Phone Number</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilPhone} />
                        </CInputGroupText>
                        <CFormInput
                          id="phone"
                          name="phone"
                          type="tel"
                          value={user.phone}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                        />
                      </CInputGroup>
                    </div>

                    <div className="mb-3">
                      <CFormLabel htmlFor="gender" className="fw-semibold">Gender</CFormLabel>
                      <CFormSelect
                        id="gender"
                        name="gender"
                        value={user.gender}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </CFormSelect>
                    </div>

                    <CRow>
                      <CCol md={6}>
                        <div className="mb-3">
                          <CFormLabel htmlFor="dob" className="fw-semibold">Date of Birth</CFormLabel>
                          <CInputGroup>
                            <CInputGroupText>
                              <CIcon icon={cilCalendar} />
                            </CInputGroupText>
                            <CFormInput
                              id="dob"
                              name="dob"
                              type="date"
                              value={user.dob}
                              onChange={handleChange}
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </CInputGroup>
                        </div>
                      </CCol>
                      <CCol md={6}>
                        <div className="mb-3">
                          <CFormLabel htmlFor="age" className="fw-semibold">Age</CFormLabel>
                          <CFormInput
                            id="age"
                            name="age"
                            type="number"
                            value={user.age}
                            onChange={handleChange}
                            min="1"
                            max="120"
                            placeholder="Enter age"
                          />
                        </div>
                      </CCol>
                    </CRow>

                    <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                      <CButton 
                        color="dark" 
                        onClick={() => navigate(-1)}
                        className="text-light"
                      >
                        Back
                      </CButton>
                      <CButton 
                        type="submit" 
                        color="primary" 
                        disabled={loading}
                        className="px-4"
                      >
                        {loading ? (
                          <>
                            <CSpinner component="span" size="sm" aria-hidden="true" />
                            <span className="ms-2">Saving...</span>
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </CButton>
                    </div>
                    </CForm>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CContainer>
      </main>
    </div>
  );
};

export default ProfileUpdates;