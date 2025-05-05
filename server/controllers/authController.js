// import userModel from "../model/userModel.js";
// import bcrypt from "bcryptjs";
// import { generateToken, setTokenCookie } from "../utils/jwt.js";

// class UserController {
//    register=async(req, res)=> {
//     const { name, email, password } = req.body;

//     if (!name || !password || !email) {
//       return res.json({ success: false, message: "Missing Details" });
//     }

//     try {
//       const existingUser = await userModel.findOne({ email });
//       if (existingUser) {
//         return res.status(400).json({ success: false, message: "Email already exists" });
//       }

//       const hashedPassword = await bcrypt.hash(password, 10);
//       const user = new userModel({ name, email, password: hashedPassword });
//       await user.save();

//       const token = generateToken(user._id);
//       setTokenCookie(res, token);

//       res.status(201).json({ success: true, message: "User registered successfully" });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   login=async (req, res) =>{
//     const { email, password } = req.body;
//     if (!password || !email) {
//       return res.json({ success: false, message: "Email and Password are required" });
//     }

//     try {
//       const user = await userModel.findOne({ email });
//       if (!user || !(await bcrypt.compare(password, user.password))) {
//         return res.status(400).json({ success: false, message: "Invalid email or password" });
//       }

//       const token = generateToken(user._id);
//       setTokenCookie(res, token);

//       return res.status(200).json({ success: true, message: "User logged in", user: { name: user.name, email: user.email } });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   logout=async (req, res)=> {
//     try {
//       res.clearCookie("token", {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
//       });
//       return res.json({ success: true, message: "User logged out" });
//     } catch (error) {
//       res.json({ success: false, message: error.message });
//     }
//   }

//    changePassword=async (req, res)=> {
//     const { email, oldPassword, newPassword } = req.body;
//     if (!oldPassword || !newPassword || !email) {
//       return res.json({ success: false, message: "Email and Password are required" });
//     }

//     try {
//       const user = await userModel.findOne({ email });
//       if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
//         return res.status(400).json({ success: false, message: "Invalid credentials" });
//       }

//       user.password = await bcrypt.hash(newPassword, 10);
//       await user.save();

//       res.status(200).json({ success: true, message: "Password changed successfully" });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   deleteUser=async (req, res)=> {
//     try {
//       const user = await userModel.findByIdAndDelete(req.params.userId);
//       if (!user) {
//         return res.status(404).json({ success: false, message: "User not found" });
//       }
//       return res.status(200).json({ success: true, message: "User deleted successfully" });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//    getAllUserData=async (req, res)=> {
//     try {
//       const users = await userModel.find({});
//       res.json(users);
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//    getUserProfile=async (req, res)=> {
//     try {
//       const user = await userModel.findById(req.params.userId);
//       if (!user) {
//         return res.status(404).json({ success: false, message: "User not found" });
//       }
//       return res.status(200).json({ success: true, user });
//     } catch (error) {
//       res.status(500).json({ success: false, message: "Internal server error" });
//     }
//   }

//    updateProfile=async (req, res)=> {
//     const { name, age, email } = req.body;
//     try {
//       if (!email || !name || !age) {
//         return res.status(400).json({ success: false, message: "All fields are required" });
//       }

//       const updatedUser = await userModel.findOneAndUpdate(
//         { email },
//         { $set: { name, age } },
//         { new: true, runValidators: true }
//       );

//       if (!updatedUser) {
//         return res.status(404).json({ success: false, message: "User not found" });
//       }

//       return res.status(200).json({
//         success: true,
//         message: "Profile updated successfully",
//         user: { name: updatedUser.name, email: updatedUser.email, age: updatedUser.age },
//       });
//     } catch (error) {
//       res.status(500).json({ success: false, message: "Internal server error" });
//     }
//   }
// }

// export default new UserController();