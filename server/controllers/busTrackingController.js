// BusTrackingController.js (final polished)
import BusTrackingModel from "../model/BusTrackingModel.js";
import BusModel from "../model/BusModel.js";
import mongoose from "mongoose";

class BusTrackingController {
  // ✅ Update Live Bus Location
  updateBusLocation = async (req, res) => {
    try {
      const { busId, latitude, longitude, speed,leaveTimestamp } = req.body;
      const driverId = req.user?.id;

      // Basic validation
      if (!busId || latitude === undefined || longitude === undefined || speed === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: busId, latitude, longitude, speed" 
        });
      }

      // Validate coordinates
      if (
        typeof latitude !== "number" || typeof longitude !== "number" ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
      ) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid coordinates" 
        });
      }

      // Check if bus exists
      const bus = await BusModel.findById(busId);
      if (!bus) {
        return res.status(404).json({ 
          success: false, 
          message: "Bus not found" 
        });
      }

      // Create tracking record
      const trackingEntry = new BusTrackingModel({
        busId,
        driverId,
        location: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        speed,
        isReturnTrip: bus.isReturnTrip,
        leaveTimestamp,
        
      });

      await trackingEntry.save();

      // Update bus current location
      bus.currentLocation = {
        latitude,
        longitude,
        speed,
        timestamp: new Date()
      };
      bus.lastUpdated = new Date();
      await bus.save();

      // Emit real-time update
      const io = req.app.get("io");
      if (io) {
        io.emit("bus-location-updated", {
          busId,
          location: { latitude, longitude },
          speed,
          timestamp: new Date()
        });
      }

      res.status(200).json({
        success: true,
        message: "Location updated successfully",
        data: trackingEntry
      });

    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  };

  // ✅ Get Bus Tracking History
  getBusHistory = async (req, res) => {
    try {
      const { busId } = req.params;
      const { startDate, endDate, limit = 100 } = req.query;

      const query = { busId };

      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const history = await BusTrackingModel.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      if (!history.length) {
        return res.status(404).json({ 
          success: false, 
          message: "No tracking history found" 
        });
      }

      res.status(200).json({ 
        success: true, 
        data: history 
      });
    } catch (error) {
      console.error("Error retrieving history:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  };

  // ✅ Get Current Location of Bus
  getCurrentLocation = async (req, res) => {
    try {
      const { busId } = req.params;

      const [latestLocation, bus] = await Promise.all([
        BusTrackingModel.findOne({ busId }).sort({ createdAt: -1 }).lean(),
        BusModel.findById(busId).lean()
      ]);

      if (!latestLocation && !bus?.currentLocation) {
        return res.status(404).json({ 
          success: false, 
          message: "No location data available for this bus" 
        });
      }

      const locationData = latestLocation || {
        location: {
          coordinates: [
            bus.currentLocation.longitude,
            bus.currentLocation.latitude
          ]
        },
        speed: bus.currentLocation.speed,
        createdAt: bus.currentLocation.timestamp
      };

      res.status(200).json({
        success: true,
        data: locationData
      });
    } catch (error) {
      console.error("Error fetching current location:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  // ✅ Get Buses Near Location
  getBusesNearLocation = async (req, res) => {
    try {
      const { longitude, latitude, maxDistance = 5000 } = req.query;

      if (longitude === undefined || latitude === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: "Longitude and latitude are required" 
        });
      }

      const buses = await BusTrackingModel.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            distanceField: "distance",
            maxDistance: parseInt(maxDistance),
            spherical: true
          }
        },
        { $sort: { distance: 1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: "buses",
            localField: "busId",
            foreignField: "_id",
            as: "busDetails"
          }
        },
        { $unwind: "$busDetails" },
        {
          $project: {
            _id: 1,
            busId: 1,
            location: 1,
            speed: 1,
            distance: 1,
            createdAt: 1,
            busNumber: "$busDetails.busNumber",
            status: "$busDetails.status"
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: buses
      });
    } catch (error) {
      console.error("Error finding nearby buses:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };
}

export default new BusTrackingController();
