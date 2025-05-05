import jwt from "jsonwebtoken";
import { Roles } from "../content/enum.js";



export const authenticateUser = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");

    if (!decoded.userId) {
      return res.status(403).json({ message: "Forbidden: Invalid token structure" });
    }

    req.user = {
      id: decoded.userId,  // Ensure correct field name
      role: decoded.role,  // Attach role for authorization checks
    };

    next();
  } catch (err) {
    console.error("Token Verification Error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    res.status(403).json({ message: "Forbidden: Invalid token" });
  }
};


// Admin Authorization Middleware
export const authorizeAdmin = (req, res, next) => {
  if (req.user?.role == "Admin") {
    
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};

export const verifyAdminAndDriver = (req, res, next) => {

  
    if (!Roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Access denied: Only drivers can perform this action" });
    }
    next();
};




  

  
export const authorizeDriver = (req, res, next) => {
  if (req.user?.role!== "Driver") {
    
    return res.status(403).json({ message: "Access denied: Driver only" });
  }
  next();
};
  