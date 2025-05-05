import mongoose from "mongoose";

const BusAssignSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null, index: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true, index: true }
}, { timestamps: true }); 

const BusAssignModel = mongoose.model("BusAssign", BusAssignSchema);

export default BusAssignModel;
