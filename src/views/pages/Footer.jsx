import React from "react";

const Footer = () => {
    return (
        <footer className="bg-dark text-white text-center py-3 mt-auto">
            <p className="mb-0">&copy; {new Date().getFullYear()} College Bus Tracking System. All Rights Reserved.</p>
        </footer>
    );
};

export default Footer;
