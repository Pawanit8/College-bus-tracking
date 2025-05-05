import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  gender: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say"] },
  dob: { type: Date },
  age: { type: Number },
  profilePicture: { type: String }, // Will store the path or URL to the image
  role: { type: String, enum: ["Admin", "Student", "Driver"], default: "Student" },
  
  
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;
