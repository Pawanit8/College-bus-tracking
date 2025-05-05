import mongoose from "mongoose";

const DriverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  }
}, {
  timestamps: true,
 
});


const DriverModel = mongoose.model("Driver", DriverSchema);

export default DriverModel;