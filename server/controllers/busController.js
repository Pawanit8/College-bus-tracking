// BusController.js (optimized)
import BusModel from "../model/BusModel.js";
import DriverModel from "../model/DriverModel.js";
import RouteModel from "../model/RouteModel.js";
import Joi from "joi";
import UserModel from "../model/UserModel.js";
import BusTrackingModel from "../model/BusTrackingModel.js";
import DelayReport from "../model/DelayReport.js";
import mongoose from "mongoose";

class BusController {
  constructor() {
    // Enhanced validation schema
    this.busSchema = Joi.object({
      busNumber: Joi.string().required().pattern(/^[A-Z0-9-]+$/),
      capacity: Joi.number().required().min(1).max(100),
      driverId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
      routeId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
      status: Joi.string().valid("active", "maintenance", "inactive").default("active"),
      currentLocation: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        speed: Joi.number().min(0).optional()
      }).required(),
      isReturnTrip: Joi.boolean().default(false)
    }).options({ stripUnknown: true });

    this.delaySchema = Joi.object({
      reason: Joi.string().required().max(200),
      duration: Joi.number().required().min(1).max(240) // 1-240 minutes
    });
  }

  // ✅ Add New Bus (optimized with transaction)
  addBus = async (req, res) => {
    try {
        const { error, value } = this.busSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { busNumber, capacity, status, driverId, routeId, currentLocation } = value;

        // Check if the driver exists and is not already assigned to another bus
        let assignedDriver = null;
        if (driverId) {
            assignedDriver = await DriverModel.findById(driverId);
            if (!assignedDriver) {
                return res.status(404).json({ success: false, message: "Driver not found" });
            }

            if (assignedDriver.busId) {
                return res.status(400).json({ success: false, message: "Driver is already assigned to another bus" });
            }
        }

        // Check if the route exists
        let assignedRoute = null;
        if (routeId) {
            assignedRoute = await RouteModel.findById(routeId);
            if (!assignedRoute) {
                return res.status(404).json({ success: false, message: "Route not found" });
            }

            // Since assignedBus is a single ObjectId, we can just check if it's null
            if (assignedRoute.assignedBus && assignedRoute.assignedBus !== null) {
                return res.status(400).json({ success: false, message: "This route already has a bus assigned" });
            }
        }

        // Create new bus entry
        const newBus = new BusModel({
            busNumber,
            capacity,
            status,
            driverId: assignedDriver?._id || null,
            routeId: assignedRoute?._id || null,
            currentLocation,
            lastUpdated: new Date(),
        });

        await newBus.save();

        // If the driver is assigned, update their busId
        if (assignedDriver) {
            await DriverModel.findByIdAndUpdate(driverId, { busId: newBus._id });
        }

        // If the route is assigned, update the route with the busId (overwrite the assignedBus)
        if (assignedRoute) {
            await RouteModel.findByIdAndUpdate(routeId, { assignedBus: newBus._id });
        }

        res.status(201).json({ success: true, message: "Bus added successfully", bus: newBus });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error adding bus", error: err.message });
    }
};


  //not assigned bus
  getNotAssignedBus = async (req, res) => {
    try {
      const buses = await BusModel.find({ driverId: null });
      res.status(200).json({ success: true, buses });
    } catch (err) {
      console.error("Error fetching not assigned buses:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };






  // ✅ Get All Buses (optimized with pagination)
  getAllBuses = async (req, res) => {
    try {
          const buses = await BusModel.find()
          .populate('routeId' , 'routeName')
          .populate({
            path: 'driverId',
            populate: {
              path: 'userId',
              model: 'User',
              select: 'name email phone'
            }
          })
          .lean();
  
      res.status(200).json({
        success: true,
        data:buses,
      });
      
  
    } catch (err) {
      console.error("Error fetching buses:", err);
      res.status(500).json({
        success: false,
        message: "Error fetching buses",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  };

  // ✅ Get Bus by ID (optimized)
  
getBusById = async (req, res) => {
  try {
      // Validate ID format first
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return res.status(400).json({
              success: false,
              message: "Invalid bus ID format"
          });
      }

      // Find bus with deep population
      const bus = await BusModel.findById(req.params.id)
          .populate({
              path: 'driverId',
              select: 'licenseNumber status',
              populate: {
                  path: 'userId',
                  select: 'name email phone profileImage'
              }
          })
          .populate({
              path: 'routeId',
              select: 'routeName startLocation endLocation stops totalDistance estimatedDuration',
              populate: {
                  path: 'stops',
                  select: 'name location order'
              }
          })
          .lean();

      if (!bus) {
          return res.status(404).json({ 
              success: false, 
              message: "Bus not found" 
          });
      }

      // Get recent tracking history with additional data
      const trackingHistory = await BusTrackingModel.find({ busId: bus._id })
          .sort({ timestamp: -1 })
          .limit(15)
          .select('location speed status timestamp')
          .lean();

      // Calculate average speed from tracking history
      const avgSpeed = trackingHistory.length > 0 
          ? trackingHistory.reduce((sum, entry) => sum + entry.speed, 0) / trackingHistory.length
          : 0;

      // Format the response data
      const responseData = {
          bus: {
              ...bus,
              stats: {
                  avgSpeed: parseFloat(avgSpeed.toFixed(2)),
                  lastUpdated: trackingHistory[0]?.timestamp || null
              },
              trackingHistory
          }
      };

      res.status(200).json({ 
          success: true, 
          data: responseData
      });

  } catch (err) {
      console.error("Error fetching bus details:", err);
      
      // Handle specific errors
      let errorMessage = "Internal server error";
      let statusCode = 500;
      
      if (err.name === 'CastError') {
          errorMessage = "Invalid bus ID format";
          statusCode = 400;
      } else if (err.name === 'MongoError') {
          errorMessage = "Database operation failed";
      }

      res.status(statusCode).json({ 
          success: false, 
          message: errorMessage,
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
  }
};


//update bus
updateBus = async (req, res) => {
  try {
    const { busNumber, capacity, status, driverId, routeId } = req.body;
    console.log("🚀 ~ file: busController.js:242 ~ req.body:", req.body)
    const busId = req.params.id;

    // Validate required fields
    if (!busNumber || !capacity || !status) {
      return res.status(400).json({ 
        success: false, 
        message: "Bus number, capacity, and status are required fields" 
      });
    }

    // Check if bus exists
    const existingBus = await BusModel.findById(busId);
    if (!existingBus) {
      return res.status(404).json({ 
        success: false, 
        message: "Bus not found" 
      });
    }

    // DRIVER REASSIGNMENT LOGIC
    if (driverId !== undefined) { // Explicit check for undefined (includes null)
      // If removing driver (driverId is null)
      if (!driverId) {
        if (existingBus.driverId) {
          await DriverModel.findByIdAndUpdate(
            existingBus.driverId,
            { $unset: { busId: "" } }
          );
        }
      } 
      // If changing driver
      else if (driverId !== existingBus.driverId?.toString()) {
        const newDriver = await DriverModel.findById(driverId);
        if (!newDriver) {
          return res.status(404).json({ 
            success: false, 
            message: "Driver not found" 
          });
        }

        // Check if driver is already assigned to another bus
        if (newDriver.busId && newDriver.busId.toString() !== busId) {
          return res.status(400).json({ 
            success: false, 
            message: "Driver is already assigned to another bus" 
          });
        }

        if (existingBus.driverId) {
          await DriverModel.findByIdAndUpdate(
            existingBus.driverId,
            { $unset: { busId: "" } }
          );
        }
        
        // Assign new driver
        await DriverModel.findByIdAndUpdate(
          driverId,
          { $set: { busId: busId } }
        );
      }
    }
    // ROUTE REASSIGNMENT LOGIC
    if (routeId !== undefined) { // Explicit check for undefined (includes null)
      // If removing route (routeId is null)
      if (!routeId) {
        if (existingBus.routeId) {
          await RouteModel.findByIdAndUpdate(
            existingBus.routeId,
            { $pull: { assignedBuses: busId } }
          );
        }
      } 
      // If changing route
      else if (routeId !== existingBus.routeId?.toString()) {
        const newRoute = await RouteModel.findById(routeId);
        if (!newRoute) {
          return res.status(404).json({ 
            success: false, 
            message: "Route not found" 
          });
        }

        // Remove from old route
        if (existingBus.routeId) {
          await RouteModel.findByIdAndUpdate(
            existingBus.routeId,
            { $pull: { assignedBuses: busId } }
          );
        }

        // Add to new route
        await RouteModel.findByIdAndUpdate(
          routeId,
          { $addToSet: { assignedBuses: busId } }
        );
      }
    }

    const updatedBus = await BusModel.findByIdAndUpdate(
      busId,
      {
        busNumber,
        capacity,
        status,
        lastUpdated: new Date(),
        driverId: driverId || null,
        routeId: routeId || null
      },
      { new: true }
    )
    .populate({
      path: "driverId",
      populate: { path: "userId", select: "name email" }
    })
    .populate("routeId");

    res.status(200).json({
      success: true,
      message: "Bus updated successfully",
      data: updatedBus
    });

  } catch (err) {
    console.error("Error updating bus:", err);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error while updating bus",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

  // ✅ Delete Bus (optimized with transaction)
  deleteBus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const busId = req.params.id;
      const bus = await BusModel.findById(busId).session(session);
      
      if (!bus) {
        await session.abortTransaction();
        return res.status(404).json({ 
          success: false, 
          message: "Bus not found" 
        });
      }

      // Unassign driver if exists
      if (bus.driverId) {
        await DriverModel.findByIdAndUpdate(
          bus.driverId, 
          { $unset: { busId: "" } }, 
          { session }
        );
      }

      // Unassign from route if exists
      if (bus.routeId) {
        await RouteModel.findByIdAndUpdate(
          bus.routeId, 
          { $unset: { assignedBus: "" } }, 
          { session }
        );
      }

      // Unassign from route if exists
      if (bus.routeId) {
        await RouteModel.findByIdAndUpdate(
          bus.routeId, 
          { $unset: { assignedBus: "" } }, 
          { session }
        );
      }
      // Delete bus
      await BusModel.findByIdAndDelete(busId, { session });

      // Delete associated tracking data
      await BusTrackingModel.deleteMany({ busId }, { session });

      await session.commitTransaction();

      res.status(200).json({ 
        success: true, 
        message: "Bus deleted successfully" 
      });
    } catch (err) {
      await session.abortTransaction();
      console.error("Error deleting bus:", err);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    } finally {
      session.endSession();
    }
  };

  // ✅ Report Delay
  reportDelay = async (req, res) => {
    try {
      const { error, value } = this.delaySchema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          success: false, 
          message: error.details[0].message 
        });
      }

      const busId = req.params.id;
      const { reason, duration } = value;

      const bus = await BusModel.findById(busId);
      if (!bus) {
        return res.status(404).json({ 
          success: false, 
          message: "Bus not found" 
        });
      }

      bus.delayInfo = {
        isDelayed: true,
        reason,
        duration,
        timestamp: new Date()
      };

      await bus.save();

      res.status(200).json({ 
        success: true, 
        message: "Delay reported successfully",
        data: bus 
      });
    } catch (err) {
      console.error("Error reporting delay:", err);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  };

  // ✅ Resolve Delay
  resolveDelay = async (req, res) => {
    try {
      const busId = req.params.id;
      const bus = await BusModel.findById(busId);
      
      if (!bus) {
        return res.status(404).json({ 
          success: false, 
          message: "Bus not found" 
        });
      }

      if (!bus.delayInfo?.isDelayed) {
        return res.status(400).json({ 
          success: false, 
          message: "Bus is not currently delayed" 
        });
      }

      bus.delayInfo.isDelayed = false;
      await bus.save();

      res.status(200).json({ 
        success: true, 
        message: "Delay resolved successfully",
        data: bus 
      });
    } catch (err) {
      console.error("Error resolving delay:", err);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  };

  // ✅ Get Dashboard Stats (optimized)
  getDashboardData = async (req, res) => {
    try {
      const [
        totalBuses,
        activeBuses,
        delayedBuses,
        totalUsers,
        totalRoutes,
        totalDrivers,
        recentDelays
      ] = await Promise.all([
        BusModel.countDocuments(),
        BusModel.countDocuments({ status: "active" }),
        BusModel.countDocuments({ "delayInfo.isDelayed": true }),
        UserModel.countDocuments(),
        RouteModel.countDocuments(),
        DriverModel.countDocuments(),
        BusModel.find({ "delayInfo.isDelayed": true })
          .sort({ "delayInfo.timestamp": -1 })
          .limit(5)
          .populate('driverId')
          .populate('routeId', 'routeName')
          
          .lean()
      ]);
      const delayReports = await DelayReport.find({ resolved: false }).lean();

      res.status(200).json({
        success: true,
        data: {
          totalBuses,
          activeBuses,
          delayedBuses,
          totalUsers,
          totalRoutes,
          totalDrivers,
          recentDelays,
          delayReports
        }
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  };

  // ✅ Search Bus by Number (optimized)
  searchBus = async (req, res) => {
    try {
      // Validate input
      const { busNumber } = req.params;
      
      if (!busNumber || busNumber.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: "Bus number is required",
          errorCode: "MISSING_BUS_NUMBER"
        });
      }

      // Sanitize bus number (remove extra spaces, etc.)
      const cleanBusNumber = busNumber.trim().toUpperCase();

      // Search for bus with case-insensitive exact match
      const bus = await BusModel.findOne({ 
        busNumber: { $regex: `^${cleanBusNumber}$`, $options: 'i' }
      })
      .populate({
        path: 'routeId',
        select: 'routeName startLocation endLocation stops'
      })
      .populate({
        path: 'driverId',
        select: 'name contactNumber',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .lean(); // Use lean() for better performance

      if (!bus) {
        return res.status(404).json({ 
          success: false, 
          message: "Bus not found",
          errorCode: "BUS_NOT_FOUND"
        });
      }

      // Format the response
      

      res.status(200).json({ 
        success: true, 
        data: bus  
      });

    } catch (err) {
      console.error("Error searching bus:", err);
      
      // Handle specific errors
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid bus number format",
          errorCode: "INVALID_BUS_NUMBER_FORMAT"
        });
      }

      res.status(500).json({ 
        success: false, 
        message: "Failed to search for bus",
        errorCode: "SEARCH_FAILED",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  };

  
  // ✅ Get Bus Location History
  getBusLocationHistory = async (req, res) => {
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

      res.status(200).json({ 
        success: true, 
        data: history 
      });
    } catch (err) {
      console.error("Error fetching location history:", err);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  };


//  report delay
reportDelay = async (req, res) => {
  try {
    const { busId, reason, duration, resolve } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate required fields
    if (!busId) {
      return res.status(400).json({ success: false, message: 'Bus ID is required' });
    }

    // Check if bus exists
    const bus = await BusModel.findById(busId);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    // Handle delay resolution
    if (resolve) {
      // Only admin, dispatcher, or the driver who reported can resolve
      if (userRole === 'Driver' || userRole==='driver' ) {
        const lastReport = await DelayReport.findOne({ bus: busId })
          .sort({ createdAt: -1 });
        
        if (!lastReport || lastReport.reportedBy.toString() !== userId) {
          return res.status(403).json({ 
            success: false, 
            message: 'Only the reporting driver can resolve this delay' 
          });
        }
      }

      // Update bus status
      bus.delayInfo = {
        isDelayed: false,
        delayMinutes: 0,
        reason: null
      };
      await bus.save();

      // Mark all active delay reports as resolved
      await DelayReport.updateMany(
        { bus: busId, resolved: false },
        { resolved: true, resolvedAt: new Date(), resolvedBy: userId }
      );

      return res.json({ 
        success: true, 
        message: 'Delay resolved successfully' 
      });
    }

    // Handle delay reporting
    if (!reason || !duration) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reason and duration are required for reporting delays' 
      });
    }

    // Create new delay report
    const delayReport = new DelayReport({
      bus: busId,
      reason,
      duration,
      reportedBy: userId,
      role: userRole
    });

    await delayReport.save();

    // Update bus status
    bus.delayInfo = {
      isDelayed: true,
      delayMinutes: duration,
      reason,
      lastUpdated: new Date()
    };
    await bus.save();

    // Notify relevant parties (admin/dispatcher)
    // You would implement your notification system here

    res.status(201).json({ 
      success: true, 
      message: 'Delay reported successfully',
      report: delayReport
    });

  } catch (error) {
    console.error('Error handling delay:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error handling delay' 
    });
  }
};

getDelayedBuses = async (req, res) => {
  try {
    const buses = await BusModel.find({ 'delayInfo.isDelayed': true });
    res.json({ success: true, data: buses });
  } catch (error) {
    console.error('Error fetching delayed buses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching delayed buses' 
    });
  }
}
};

export default new BusController();