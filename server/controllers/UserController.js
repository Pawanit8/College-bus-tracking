import UserModel from "../model/UserModel.js";
import bcrypt from "bcryptjs";
import { generateToken, setTokenCookie } from "../utils/jwt.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../validators/userValidators.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class UserController {
    // User Registration
    register = async (req, res) => {
      try {
        const { error } = registerSchema.validate(req.body);
        if (error) {
          return res.status(400).json({ success: false, message: error.details[0].message });
        }
  
        const { name, email, password, role } = req.body;
  
        // Check if user already exists
        const existingUser = await UserModel.findOne({ email }).select("_id");
        if (existingUser) {
          return res.status(400).json({ success: false, message: "Email already exists" });
        }
  
        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new UserModel({ name, email, password: hashedPassword, role });
        await user.save();
  
        // Generate and set token
        const token = generateToken(user._id);
        setTokenCookie(res, token);
  
        console.log("✅ User registered:", user._id);
  
        res.status(201).json({
          success: true,
          message: "User registered successfully",
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        });
      } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
      }
    };

  // User Login
  login = async (req, res) => {
    const { email, password, role } = req.body;
  
    try {
      const user = await UserModel.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))){
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Check role if provided
      if (role && user.role !== role) {
        return res.status(403).json({ message: "Access denied for this role" });
      }
  
      const token = generateToken(user);
      setTokenCookie(res, token);
  
      return res.status(200).json({
        message: "User logged in",
        token,
        user: { 
          _id: user._id,
          name: user.name, 
          email: user.email, 
          role: user.role,
          profilePicture: user.profilePicture
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // User Logout
  logout = async (req, res) => {
    try {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });
      return res.json({ success: true, message: "User logged out" });
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
  };

  // Change Password
  changePassword = async (req, res) => {
    const { error } = changePasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id; // Get user ID from authenticated request

    try {
      const user = await UserModel.findById(userId);
      if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
        return res.status(400).json({ success: false, message: "Invalid credentials" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // Get All Users (Admin Only)
  getAllUserData = async (req, res) => {
    try {
      const users = await UserModel.find({}).select('-password');
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // Get User Profile
  // In UserController.js
  // In UserController.js
  getCurrentUser = async (req, res) => {
    try {
      // Get user with sensitive fields excluded
      const user = await UserModel.findById(req.user.id)
        .select('-password -__v -createdAt -updatedAt');
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
  
      // Convert Mongoose document to plain object
      const userObject = user.toObject();
  
      // Add full URL for profile picture if it exists
      if (userObject.profilePicture) {
        userObject.profilePictureUrl = `${req.protocol}://${req.get('host')}${userObject.profilePicture}`;
      }
  
      // Filter sensitive data
      const safeUserData = {
        _id: userObject._id,
        name: userObject.name,
        email: userObject.email,
        phone: userObject.phone,
        gender: userObject.gender,
        dob: userObject.dob,
        age: userObject.age,
        role: userObject.role,
        profilePicture: userObject.profilePicture,
        profilePictureUrl: userObject.profilePictureUrl
      };
  
      return res.status(200).json({ 
        success: true, 
        user: safeUserData 
      });
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Update Profile with Profile Picture
  
  UserUpdatebyAdmin = async (req, res) => {
    try {
      if (!req.params.userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
  
      const { name, email, age, phone, gender, dob } = req.body;
      
      const user = await UserModel.findByIdAndUpdate(
        req.params.userId,  // Use the ID from URL params
        { name, email, age, phone, gender, dob },
        { new: true, runValidators: true }
      ).select('-password');
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.status(200).json({ success: true, user });
    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({ success: false, message: "Invalid user ID format" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
  

  // Delete User (Admin Only)
  deleteUser = async (req, res) => {
    try {
      const user = await UserModel.findByIdAndDelete(req.params.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Delete profile picture if exists
      if (user.profilePicture) {
        const imagePath = path.join(__dirname, '..', user.profilePicture);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      return res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }


  getUserById = async (req, res) => {
    try {
      if (!req.params.userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
  
      const user = await UserModel.findById(req.params.userId).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.status(200).json({ success: true, user });
    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({ success: false, message: "Invalid user ID format" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // Update user profile (for admin editing any user)
  updateUserProfile = async (req, res) => {
    try {
      const userId = req.user.id;
      const file = req.file;
      
      // Validate request body
      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed',
          errors 
        });
      }
  
      // Get current user
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
  
      // Handle file upload
      let profilePicturePath = user.profilePicture;
      if (file) {
        const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
  
        // Delete old profile picture
        if (user.profilePicture) {
          const oldImagePath = path.join(__dirname, '..', user.profilePicture);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
  
        // Save new file
        const fileName = `${userId}-${Date.now()}${path.extname(file.originalname)}`;
        const filePath = path.join(uploadDir, fileName);
        await fs.promises.writeFile(filePath, file.buffer);
        profilePicturePath = `/uploads/profile-pictures/${fileName}`;
      }
  
      // Update user
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { 
          ...value, // Validated values
          profilePicture: profilePicturePath 
        },
        { 
          new: true,
          runValidators: true 
        }
      ).select('-password');
  
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Update error:", error);
      return res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to update profile" 
      });
    }
  };
  
};

export default new UserController();