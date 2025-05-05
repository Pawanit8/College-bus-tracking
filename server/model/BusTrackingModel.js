// BusTrackingModel.js (optimized)
import mongoose from "mongoose";

const BusTrackingSchema = new mongoose.Schema({
  busId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Bus", 
    required: true, 
    index: true 
  },
  driverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Driver", 
    required: true 
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  speed: { 
    type: Number, 
    required: true,
    min: 0 
  },
  isReturnTrip: {
    type: Boolean,
    default: false
  },
  nextStop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stop"
  },
  arrivalTimestamp: { 
    type: Date, 
    default: null 
  },
  estimatedArrivalTime: { 
    type: Date, 
    default: null 
  },
  leaveTimestamp: { 
    type: Date, 
    default: null 
  }
}, { 
  timestamps: true,
  autoIndex: true 
});

// Create geospatial index for location queries
BusTrackingSchema.index({ location: '2dsphere' });
BusTrackingSchema.index({ busId: 1, createdAt: -1 });

const BusTrackingModel = mongoose.model("BusTracking", BusTrackingSchema);
export default BusTrackingModel;