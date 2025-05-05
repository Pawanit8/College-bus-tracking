import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CNavbar, CNavbarBrand, CNavbarToggler, CCollapse, CNavbarNav, CNavItem, CNavLink, CContainer } from "@coreui/react";
import { Menu } from "lucide-react";
import AppHeaderDropdown from "./driverdashboard/AppHeaderDropdown";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation(); // ✅ Get current route

    return (
        <>
            <CNavbar expand="lg" className="bg-primary shadow-sm py-2">
                <CContainer fluid className="d-flex justify-content-between align-items-center">
                    
                    {/* ✅ Brand Logo */}
                    <CNavbarBrand as={Link} to="/student-dashboard" className="fw-bold text-light d-flex align-items-center">
                        <img src="/CBTS.png" alt="CBTS Logo" width="140" height="45" className="rounded shadow-sm" />
                    </CNavbarBrand>

                    {/* ✅ Mobile Menu Toggle */}
                    <CNavbarToggler onClick={() => setIsOpen(!isOpen)}>
                        <Menu size={28} className="text-light cursor-pointer" />
                    </CNavbarToggler>

                    {/* ✅ Collapsible Navbar Items */}
                    <CCollapse className="navbar-collapse" visible={isOpen}>
                        <CNavbarNav className="ms-auto d-flex gap-4 align-items-center">
                            {[
                                { path: "/student-dashboard", label: "Home" },
                                { path: "/about", label: "About" },
                                { path: "/feedback", label: "Feedback" },
                                { path: "/search-bus", label: "Search" },
                            ].map(({ path, label }, index) => (
                                <CNavItem key={index}>
                                    <CNavLink 
                                        as={Link} 
                                        to={path} 
                                        className={`fs-5 fw-bold nav-link-custom ${location.pathname === path ? "active" : ""}`}
                                    >
                                        {label}
                                    </CNavLink>
                                </CNavItem>
                            ))}
                            <AppHeaderDropdown />
                        </CNavbarNav>
                    </CCollapse>
                </CContainer>
            </CNavbar>

            {/* ✅ Styled CSS Inside JSX */}
            <style>
                {`
                .nav-link-custom {
                    color: white;
                    text-decoration: none;
                    transition: color 0.3s ease-in-out, border-bottom 0.3s ease-in-out;
                    padding-bottom: 5px;
                }
                
                .nav-link-custom:hover {
                    color: #fbbc04;
                }
                
                .nav-link-custom.active {
                    border-bottom: 3px solid #fbbc04;
                    color: #fbbc04;
                }

                /* ✅ Responsive Navbar */
                @media (max-width: 991px) {
                    .nav-link-custom {
                        display: block;
                        padding: 8px 0;
                    }
                }
                `}
            </style>
        </>
    );
};

export default Navbar;
