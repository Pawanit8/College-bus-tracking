import RouteModel from "../model/RouteModel.js";
import BusModel from "../model/BusModel.js";
import Joi from "joi";
import mongoose from "mongoose";

class RouteController {
  constructor() {
    this.routeSchema = Joi.object({
      _id: Joi.string().optional(), // Allow _id for the route itself
      routeName: Joi.string().required(),
      startLocation: Joi.object({
        name: Joi.string().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        time: Joi.string().required()
      }).required(),
      endLocation: Joi.object({
        name: Joi.string().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        time: Joi.string().required()
      }).required(),
      stops: Joi.array().items(
        Joi.object({
          _id: Joi.string().optional(), // Explicitly allow _id for stops
          name: Joi.string().required(),
          latitude: Joi.number().required(),
          longitude: Joi.number().required(),
          time: Joi.string().required(),
          estimatedArrivalTime: Joi.number().required(),
          actualArrivalTime: Joi.number().optional().allow(null),
          departureTime: Joi.number().optional().allow(null),
          delay: Joi.number().optional().default(0),
          status: Joi.string()
            .valid('On Time', 'Delayed', 'Early', 'Skipped', 'Not Reported')
            .default('Not Reported')
        })
      ).required(),
      totalDistance: Joi.number().required(),
      estimatedDuration: Joi.number().required(),
      assignedBus: Joi.string().optional().allow(null),
      currentStatus: Joi.string()
        .valid('Not Started', 'In Progress', 'Completed', 'Delayed', 'On Time')
        .default('Not Started'),
      delayHistory: Joi.array().optional(),
      averageDelay: Joi.number().optional().default(0)
    }).options({ stripUnknown: true }); // Remove any extra fields not in schema
  }

  // Add a New Route
  addRoute = async (req, res) => {
    try {
      const routeData = req.body;
  
      // Remove _id from stops if present
      if (routeData.stops) {
        routeData.stops = routeData.stops.map(({ _id, ...rest }) => rest);
      }
  
      // Check for existing route name
      const exists = await RouteModel.findOne({ routeName: routeData.routeName });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Route with this name already exists"
        });
      }
  
      // Add default values if missing
      routeData.currentStatus = routeData.currentStatus || 'Not Started';
      routeData.averageDelay = routeData.averageDelay || 0;
      routeData.stops = routeData.stops.map(stop => ({
        ...stop,
        actualArrivalTime: stop.actualArrivalTime || null,
        departureTime: stop.departureTime || null,
        delay: stop.delay || 0,
        status: stop.status || 'Not Reported'
      }));
  
      const newRoute = new RouteModel(routeData);
      const savedRoute = await newRoute.save();
  
      res.status(201).json({
        success: true,
        message: "Route added successfully",
        route: savedRoute
      });
  
    } catch (error) {
      console.error("Error in addRoute:", error);
      res.status(500).json({
        success: false,
        message: "Error adding route",
        error: error.message
      });
    }
  };
  

  // Get All Routes
  getAllRoutes = async (req, res) => {
    try {
      const routes = await RouteModel.find()
        .populate("assignedBus", "busNumber capacity status");
      
      res.status(200).json({ success: true, routes });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error fetching routes", 
        error: error.message 
      });
    }
  };

  // Get Route by ID
getRouteById = async (req, res) => {
  try {
    

    const route = await RouteModel.findById(req.params.id)
      .populate('assignedBus', 'busNumber model capacity')
      .populate('delayHistory.stopId', 'name')
      .lean();

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found"
      });
    }

    const transformedRoute = {
      ...route,
      stops: route.stops.map(stop => ({
        ...stop,
        arrivalStatus: stop.status,
        scheduledTime: stop.time,
        coordinates: [stop.longitude, stop.latitude]
      })),
      pathCoordinates: [
        [route.startLocation.longitude, route.startLocation.latitude],
        ...route.stops.map(stop => [stop.longitude, stop.latitude]),
        [route.endLocation.longitude, route.endLocation.latitude]
      ]
    };

    res.status(200).json({
      success: true,
      route: transformedRoute
    });

  } catch (error) {
    console.error("Error fetching route by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching route details",
      error: error.message
    });
  }
};
  // Update a Route
  updateRoute = async (req, res) => {
    try {
      // Validate request body
      const { error } = this.routeSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          success: false, 
          message: error.details[0].message 
        });
      }

      const updatedRoute = await RouteModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updatedRoute) {
        return res.status(404).json({ 
          success: false, 
          message: "Route not found" 
        });
      }

      // Update bus assignment if changed
      if (req.body.assignedBus) {
        await BusModel.findByIdAndUpdate(
          req.body.assignedBus,
          { routeId: updatedRoute._id },
          { new: true }
        );
      }

      res.status(200).json({ 
        success: true, 
        message: "Route updated successfully", 
        route: updatedRoute 
      });
    } catch (error) {
      console.error("Error updating route:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error updating route", 
        error: error.message 
      });
    }
  };

  // Delete a Route
  // Delete a Route
deleteRoute = async (req, res) => {
  try {
    const route = await RouteModel.findByIdAndDelete(req.params.id);
    
    if (!route) {
      return res.status(404).json({ 
        success: false, 
        message: "Route not found" 
      });
    }

    // Set assignedBus to null for all buses associated with this route
    await BusModel.updateMany(
      { routeId: req.params.id },
      { $set: { routeId: null } } // Remove the association with the route by setting routeId to null
    );

    res.status(200).json({ 
      success: true, 
      message: "Route deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting route", 
      error: error.message 
    });
  }

};

// Get not assigned routes
getNotAssignedRoutes = async (req, res) => {
  try {
    const routes = await RouteModel.find({ assignedBus: null });
    res.status(200).json({ success: true, routes });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching routes", 
      error: error.message 
    });
  }
};

}

export default new RouteController();