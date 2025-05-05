import mongoose from "mongoose";

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    index: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    index: true
  },
  status: {
    type: String,
    enum: ["active", "inactive", "maintenance"],
    default: "active",
    index: true
  },
  currentLocation: {
    type: {
      latitude: { 
        type: Number, 
        required: true,
        min: -90,
        max: 90
      },
      longitude: { 
        type: Number, 
        required: true,
        min: -180,
        max: 180
      },
      speed: { 
        type: Number, 
        default: 0,
        min: 0
      },
      timestamp: { 
        type: Date, 
        default: Date.now 
      }
    },
    
  },
  delayInfo: {
    isDelayed: { 
      type: Boolean, 
      default: false 
    },
    reason: String,
    duration: {
      type: Number,
      min: 1,
      max: 1440 // 24 hours in minutes
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  },
  delayHistory: [{
    reason: String,
    duration: Number,
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }],
  isReturnTrip: {
    type: Boolean,
    default: false,
    index: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
busSchema.index({ "currentLocation.latitude": 1, "currentLocation.longitude": 1 });
busSchema.index({ "delayInfo.isDelayed": 1 });

const BusModel = mongoose.model("Bus", busSchema);
export default BusModel;