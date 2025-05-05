import mongoose from "mongoose";

const stopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  time: String, // Scheduled time as string (e.g., "08:30 AM")
  estimatedArrivalTime: { type: Number, required: true }, // Minutes from start
  actualArrivalTime: Number, // Minutes from start when actually arrived
  departureTime: Number, // Minutes from start when departed
  delay: { type: Number, default: 0 }, // Calculated delay in minutes
  status: {
    type: String,
    enum: ['On Time', 'Delayed', 'Early', 'Skipped', 'Not Reported'],
    default: 'Not Reported'
  }
});

const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    startLocation: {
      name: String,
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      time: String // Departure time
    },
    endLocation: {
      name: String,
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      time: String // Arrival time
    },
    stops: [stopSchema],
    totalDistance: {
      type: Number, // in km
      required: true,
    },
    estimatedDuration: {
      type: Number, // in minutes
      required: true,
    },
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      default: null,
      
    },
    currentStatus: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Delayed', 'On Time'],
      default: 'Not Started'
    },
    delayHistory: [{
      timestamp: Date,
      stopName: String,
      delay: Number,
      status: String
    }],
    averageDelay: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Method to record arrival at a stop
routeSchema.methods.recordArrival = function(stopName, actualTimeMinutes) {
  const stopIndex = this.stops.findIndex(stop => stop.name === stopName);
  
  if (stopIndex === -1) {
    throw new Error(`Stop ${stopName} not found in route`);
  }

  const stop = this.stops[stopIndex];
  stop.actualArrivalTime = actualTimeMinutes;
  stop.delay = actualTimeMinutes - stop.estimatedArrivalTime;
  
  // Determine status
  if (stop.delay > 5) {
    stop.status = 'Delayed';
  } else if (stop.delay < -2) {
    stop.status = 'Early';
  } else {
    stop.status = 'On Time';
  }

  // Update route status
  if (stopIndex === 0 && this.currentStatus === 'Not Started') {
    this.currentStatus = 'In Progress';
  } else if (stopIndex === this.stops.length - 1) {
    this.currentStatus = 'Completed';
  }

  // Record in delay history
  this.delayHistory.push({
    timestamp: new Date(),
    stopName: stop.name,
    delay: stop.delay,
    status: stop.status
  });

  // Update average delay
  this.updateAverageDelay();
};

// Method to calculate average delay
routeSchema.methods.updateAverageDelay = function() {
  const reportedStops = this.stops.filter(stop => stop.status !== 'Not Reported');
  
  if (reportedStops.length > 0) {
    const totalDelay = reportedStops.reduce((sum, stop) => sum + (stop.delay || 0), 0);
    this.averageDelay = totalDelay / reportedStops.length;
    
    // Update route status based on average delay
    if (this.averageDelay > 10) {
      this.currentStatus = 'Delayed';
    } else if (this.averageDelay < -5) {
      this.currentStatus = 'Early';
    } else {
      this.currentStatus = 'On Time';
    }
  }
};

// Method to get current delay status
routeSchema.methods.getDelayStatus = function() {
  const lastReportedStop = [...this.stops]
    .reverse()
    .find(stop => stop.status !== 'Not Reported');
  
  const upcomingStops = this.stops
    .filter(stop => stop.status === 'Not Reported')
    .map(stop => ({
      name: stop.name,
      scheduledTime: stop.time,
      estimatedDelay: this.averageDelay,
      status: 'Pending'
    }));

  return {
    routeId: this._id,
    routeName: this.routeName,
    isDelayed: this.currentStatus === 'Delayed',
    currentDelay: lastReportedStop?.delay || 0,
    averageDelay: this.averageDelay,
    currentStop: lastReportedStop?.name || 'Not started',
    nextStop: upcomingStops[0]?.name || 'Route complete',
    upcomingStops,
    lastUpdated: this.updatedAt
  };
};

// Static method to find delayed routes
routeSchema.statics.findDelayedRoutes = function(minDelay = 5) {
  return this.find({
    currentStatus: 'Delayed',
    averageDelay: { $gte: minDelay }
  }).populate('assignedBus', 'busNumber');
};

const RouteModel = mongoose.model("Route", routeSchema);
export default RouteModel;