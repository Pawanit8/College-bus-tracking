import React, { useState, useEffect } from 'react';
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react';
import { Link, useNavigate } from "react-router-dom";
import {
  cilEnvelopeOpen,
  cilLockLocked,
  cilSettings,
  cilUser,
} from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import avatar8 from './../../assets/images/avatars/8.jpg';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const AppHeaderDropdown = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_URL}/auth/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setUserData(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Use profilePictureUrl if available, otherwise fallback to default avatar
  const avatarSrc = userData?.profilePictureUrl || avatar8;

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar 
          src={avatarSrc} 
          size="md" 
          onError={(e) => {
            e.target.src = avatar8; // Fallback if image fails to load
          }}
        />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">
          Account ({userData?.role || 'User'})
        </CDropdownHeader>
        
        <CDropdownItem as={Link} to="/send-message">
          <CIcon icon={cilEnvelopeOpen} className="me-2" />
          Send Messages
        </CDropdownItem>
       
        <CDropdownItem as={Link} to="/update-profiles">
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem>
        
        <CDropdownItem as={Link} to="/settings">
          <CIcon icon={cilSettings} className="me-2" />
          Settings
        </CDropdownItem>
        
        <CDropdownDivider />
        <CDropdownItem onClick={handleLogout}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  );
};

export default AppHeaderDropdown;