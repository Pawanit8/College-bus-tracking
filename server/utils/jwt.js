
import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },  // ✅ Ensure `userId` is a string
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "1d" }
  );
};






  

// Function to set JWT as a cookie
export const setTokenCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
    });
};
