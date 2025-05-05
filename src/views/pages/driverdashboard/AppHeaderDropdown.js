import React, { useEffect, useState } from "react";
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CSpinner
} from "@coreui/react";
import { Link, useNavigate } from "react-router-dom";
import { cilEnvelopeOpen, cilSettings, cilUser, cilLockLocked } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import axios from "axios";
import io from "socket.io-client";

import avatar8 from "../../../../src/assets/images/avatars/8.jpg";

const API_URL = import.meta.env.VITE_API_URL;
const socket = io(API_URL, { autoConnect: false });

const AppHeaderDropdown = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Axios instance with Authorization header
  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get("/auth/user/me");
        if (response.data.success && response.data.user?.profilePictureUrl) {
          // Use profilePictureUrl directly from the response
          setProfilePicture(response.data.user.profilePictureUrl);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUnreadMessages = async () => {
      try {
        const response = await axiosInstance.get("/messages/unread-count");
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    };

    fetchUserData();
    fetchUnreadMessages();

    // Socket.io connection
    socket.connect();
    socket.off("new-message").on("new-message", () => {
      setUnreadCount((prevCount) => prevCount + 1);
    });

    return () => {
      socket.off("new-message");
      socket.disconnect();
    };
  }, []);

  const handleMessagesClick = async () => {
    try {
      await axiosInstance.put("/messages/mark-as-read");
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    socket.disconnect();
    navigate("/");
  };

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        {loading ? (
          <CSpinner size="sm" />
        ) : (
          <CAvatar 
            src={profilePicture || avatar8} // Use profilePicture if available, otherwise fallback
            size="md"
            onError={(e) => {
              e.target.src = avatar8; // Fallback if image fails to load
            }}
          />
        )}
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>
        <CDropdownItem as={Link} to="/show-messages" onClick={handleMessagesClick}>
          <CIcon icon={cilEnvelopeOpen} className="me-2" />
          Messages
          {unreadCount > 0 && (
            <CBadge color="danger" className="ms-2">{unreadCount}</CBadge>
          )}
        </CDropdownItem>

        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">Settings</CDropdownHeader>
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