import DriverModel from "../model/DriverModel.js";
import BusModel from "../model/BusModel.js";
import UserModel from "../model/UserModel.js";
import BusAssignModel from "../model/BusAssisnModel.js";
import Joi from "joi";
import mongoose from "mongoose";
import RouteModel from "../model/RouteModel.js";

// Validation Schema
const driverSchema = Joi.object({
  userId: Joi.string().required(), // Accepting userId instead of name and phone
  licenseNumber: Joi.string().min(5).max(20).required(),
  bus: Joi.string().optional(), // Optional bus assignment
});

class DriverController {
  //  Add a New Driver
  addDriver = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, licenseNumber, busId } = req.body;
        
        // Validate input
        if (!userId || !licenseNumber) {
            await session.abortTransaction();
            return res.status(400).json({ 
                success: false,
                message: "User ID and license number are required" 
            });
        }

        // Check for existing driver
        const existingDriver = await DriverModel.findOne({
            $or: [
                { userId },
                { licenseNumber }
            ]
        }).session(session);

        if (existingDriver) {
            await session.abortTransaction();
            const message = existingDriver.userId.equals(userId) 
                ? "User is already a driver" 
                : "License number already in use";
            return res.status(400).json({ success: false, message });
        }

        // Create new driver - let MongoDB generate the _id automatically
        const newDriver = await DriverModel.create([{
            userId,
            licenseNumber,
            busId: busId || null
        }], { session });

        await newDriver[0].save();

        // Update bus if needed
        if (busId) {
            await BusModel.findByIdAndUpdate(
                busId, 
                { driverId: newDriver[0]._id }, 
                { session }
            );
        }

        await session.commitTransaction();
        
        return res.status(201).json({
            success: true,
            message: "Driver added successfully",
            data: newDriver[0]
        });

    } catch (err) {
        await session.abortTransaction();
        
        let errorMessage = "Server error";
        if (err.code === 11000) {
            errorMessage = err.message.includes('userId') 
                ? "User is already a driver" 
                : "License number already in use";
        }

        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    } finally {
        session.endSession();
    }
};

//get driver by unassignedbus
getDriverByUnassignedBus = async (req, res) => {
    try {
        const drivers = await DriverModel.find({ busId: null })
        .populate("userId", "name email");
        return res.status(200).json({ success: true, drivers });
    } catch (err) {
        console.error("Error fetching drivers:", err);
        return res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

  

  getUsersByRole = async (req, res) => {
    try {
      const { role } = req.query; // Get role from query params
  
      if (!role) {
        return res.status(400).json({ success: false, message: "Role is required" });
      }
  
      const users = await UserModel.find({ role }).select("name email");
      
      return res.status(200).json({ success: true, users });
    } catch (err) {
      console.error("Error fetching users by role:", err);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  };
  
  
  getAllDrivers = async (req, res) => {
    try{
    // Step 1: Get all assigned driverIds
    const assignedDrivers = await BusAssignModel.find({}, 'driverId');
    const assignedDriverIds = assignedDrivers.map(d => d.driverId?.toString()).filter(Boolean);

    // Step 2: Find drivers not in that list
    const drivers = await DriverModel.find({
      _id: { $nin: assignedDriverIds }
    })
    .populate({
      path: "userId", 
      select: "name email", 
    })
    .populate({
      path: "busId", 
      select: "busNumber",
    });
      
  
      return res.status(200).json({ success: true, drivers });
    } catch (err) {
      console.error("Error fetching drivers:", err);
      return res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
  };
  

  
  


  
  getDriverById = async (req, res) => {
    try {
        console.log("DriverId=", req.params.id); // 🔍 Debugging ID

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid driver ID" });
        }

        const driver = await DriverModel.findById(req.params.id)
            .populate("userId", "email name")
            .populate("busId", "busNumber");

        

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.json({ driver });
    } catch (error) {
        console.error("Error fetching driver:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


  //  Update a Driver
  updateDriver = async (req, res) => {
    try {
        const { name, email, licenseNumber, assignedBus } = req.body;
       
        

        // Find and verify the driver exists
        const driver = await DriverModel.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver not found" });
        }

        // Check if the associated user exists
        const existingUser = await UserModel.findById(driver.userId);
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Update driver details
        driver.licenseNumber = licenseNumber;
        
        // Update user details (Name & Email)
        existingUser.name = name;
        existingUser.email = email;

        await driver.save();
        await existingUser.save();

        //  Fix: Convert `assignedBus` (BUS-101) to its actual `_id`
        if (assignedBus) {
            const bus = await BusModel.findOne({ busNumber: assignedBus }); // Find by busNumber

            if (!bus) {
                return res.status(404).json({ success: false, message: "Assigned bus not found" });
            }

            //  Check if the bus is already assigned to another driver
            if (bus.driverId && bus.driverId.toString() !== req.params.id) {
                return res.status(400).json({
                    success: false,
                    message: "This bus is already assigned to another driver."
                });
            }

            // Update the bus to have this driver
            bus.driverId = req.params.id;
            await bus.save();

            // Update the driver to have this bus
            driver.busId = bus._id; 
            await driver.save();
        }

        // Populate updated driver details and return
        const updatedDriver = await DriverModel.findById(req.params.id)
            .populate("userId", "name email phone")
            .populate("busId", "busNumber");

        return res.status(200).json({
            success: true,
            message: "Driver updated successfully",
            updatedDriver
        });

    } catch (err) {
        console.error("Error updating driver:", err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};




  // ✅ Delete a Driver
  deleteDriver = async (req, res) => {
    try {
        const driver = await DriverModel.findByIdAndDelete(req.params.id);
        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver not found" });
        }

        // ✅ Remove the driver ID from any assigned bus
        await BusModel.updateMany({ driverId: req.params.id }, { $unset: { driverId: "" } });

        return res.status(200).json({ success: true, message: "Driver deleted successfully" });
    } catch (err) {
        console.error("Error deleting driver:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};

getAssignedBus = async (req, res) => {
  
    const userId = req.user?.id; // Extract user ID from token
    if (!userId) {
      return res.status(400).json({ message: "Bad request: No user ID found in token" });
    }

    // Find the driver based on userId
    const driver = await DriverModel.findOne({ userId });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (!driver.busId) {
      return res.status(404).json({ message: "No bus assigned to this driver" });
    }

    // Find the assigned bus details
    const bus = await BusModel.findById(driver.busId)
      .populate({
        path: "driverId",
        populate: { path: "userId", select: "name email" } //  Nested population for driver details
      })
      .populate("routeId", "stops routeName startLocation endLocation ");

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    
    if(!bus.routeId){
      return res.status(404).json({ message: "Route not found for this bus" });
    }

    res.status(200).json(bus);
  // } catch (error) {
  //   console.error(" Error fetching assigned bus:", error);
  //   res.status(500).json({ message: "Internal server error" });
  // }
};

getNotAsignnedDrivers = async (req, res) => {
    try {
      const drivers = await UserModel.aggregate([
        {
          $match: {
            $and: [
              { role: "Driver" }, // Must be a driver
               // userId must be null
            ]
          }
        },
        {
          $lookup: {
            from: "drivers",       // Foreign collection
            localField: "_id",     // Match UserModel _id
            foreignField: "userId", // Matching field in drivers collection
            as: "driversinfo"      // Output field
          }
        },
        {
          $match: { "driversinfo": { $size: 0 } } // Ensures only unassigned drivers are returned
        }
      ]);
  
      return res.status(200).json({ success: true, drivers });
    } catch (err) {
      console.error("Error fetching drivers:", err);
      return res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
  };

}

export default new DriverController();
