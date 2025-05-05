import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CNavbar, CNavbarBrand, CCollapse, CNavbarNav, CNavItem, CNavLink, CContainer } from "@coreui/react";
import AppHeaderDropdown from "./AppHeaderDropdown"; // Adjust path if necessary

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Function to toggle the mobile menu
  

  return (
    <CNavbar expand="lg" colorScheme="primary" className="bg-primary py-2">
      <CContainer fluid className="d-flex justify-content-between align-items-center">
        
        {/* Brand Logo */}
        <div className="d-flex align-items-center gap-3">
          <CNavbarBrand as={Link} to="/driver-dashboard" className="fw-bold text-light d-flex align-items-center">
            <img src="/CBTS.png" alt="CBTS Logo" width="140" height="45" className="rounded shadow-sm" />
          </CNavbarBrand>
        </div>

       

        {/* Collapsible Navbar Items */}
        
          <CNavbarNav className="ms-auto d-flex gap-3 align-items-center">
            
            <AppHeaderDropdown />
          </CNavbarNav>
        
      </CContainer>
    </CNavbar>
  );
};

export default Navbar;
