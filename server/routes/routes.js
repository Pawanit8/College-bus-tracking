import express from "express"

import DriverController from '../controllers/DriverController.js'
import busController from "../controllers/busController.js";
import routeController from "../controllers/routeController.js"
import UserController from "../controllers/UserController.js";
import { authenticateUser,authorizeAdmin,authorizeDriver, verifyAdminAndDriver} from "../middlewares/authMiddleware.js";
import upload from '../middlewares/uploadMiddleware.js';
import busTrackingController from "../controllers/busTrackingController.js";
import feedbackController from "../controllers/feedbackController.js";
import messageController from "../controllers/messageController.js";
const Router=express.Router();


// Router.put("/auth/change-password", authenticateUser, UserController.changePassword);
// Router.get('/auth/get-profile/:userId', authenticateUser, UserController.getUserProfile);

//userControll

Router.put("/updateProfile/:userId",authorizeAdmin, UserController.UserUpdatebyAdmin);
Router.get("/auth/user/me",authenticateUser, UserController.getCurrentUser);
Router.post("/auth/register", UserController.register);
Router.post("/auth/login", UserController.login);
Router.post("/auth/logout",UserController.logout);
Router.get("/auth/users", authorizeAdmin, UserController.getAllUserData);


// Router.put('/auth/update-profilepic', authenticateUser, upload.single('profilePicture'), UserController.updateProfilePic);
Router.delete("/auth/deleteUser/:userId", authorizeAdmin, UserController.deleteUser);
Router.get("/user/:userId",authenticateUser,authorizeAdmin, UserController.getUserById);
Router.put("/updateProfile",authenticateUser, upload.single('profilePicture'),authenticateUser, UserController.updateUserProfile);


// Driver 
Router.post("/addDriver",authenticateUser, DriverController.addDriver); // Add a new driver
Router.get("/allDrivers",authenticateUser,DriverController.getAllDrivers); // Get all drivers
Router.get("/allUsers", authenticateUser, DriverController.getUsersByRole);
Router.get("/getNotAssignedDriver",authenticateUser,DriverController.getNotAsignnedDrivers);
Router.put("/updateDriver/:id", authenticateUser,DriverController.updateDriver); // Update driver details
Router.delete("/deleteDriver/:id",authorizeAdmin,DriverController.deleteDriver); // Delete a driver
Router.get("/driver/bus",[authenticateUser,verifyAdminAndDriver],DriverController.getAssignedBus)
Router.get("/driver/unassigned",authenticateUser,DriverController.getDriverByUnassignedBus); // Get drivers with unassigned buses
Router.get("/driver/:id",authenticateUser, DriverController.getDriverById); // Get a specific driver by ID

//Bus 
Router.get("/Bus/:id",busController.getBusById); // Get bus by ID
Router.post("/addBus",authorizeAdmin,busController.addBus);
Router.get("/allBuses",authorizeAdmin,busController.getAllBuses); // Get all buses
Router.put("/updateBus/:id",authorizeAdmin,busController.updateBus); // Update bus
Router.delete("/deleteBus/:id",authorizeAdmin,busController.deleteBus);// Delete bus
Router.get("/dashboardData", authenticateUser,busController.getDashboardData); //get all active buses
Router.get("/searchBus/:busNumber", busController.searchBus);
Router.get("/buses/nearby", busTrackingController.getBusesNearLocation);
Router.get("/getNotAssignedBus",authenticateUser,busController.getNotAssignedBus);

Router.post("/buses/report-delay", authenticateUser, busController.reportDelay);
Router.get("/buses/delays", authenticateUser, busController.getDelayedBuses);
//report delay
//resolve delay
// Router.get("/buses/delays/reason-based", authenticateUser, busController.getDelayedBuses);


// ========== Bus Tracking Routes ==========
Router.post("/buses/location", authorizeDriver,busTrackingController.updateBusLocation);
Router.get("/buses/nearby", busTrackingController.getBusesNearLocation);
Router.get("/buses/:busId/tracking/history", authenticateUser, busTrackingController.getBusHistory);
Router.get("/buses/:busId/tracking/current", busTrackingController.getCurrentLocation);






//Bus Route
Router.get("/getRoute/:id", authenticateUser,routeController.getRouteById); // Get route by ID
Router.post("/addRoute", authorizeAdmin,routeController.addRoute); // Add a new route
Router.get("/allRoutes",authorizeAdmin, routeController.getAllRoutes); // Get all routes
Router.get("/getNotAssignedRoute",authorizeAdmin,routeController.getNotAssignedRoutes);                                                                      // Get not assigned routes
Router.put("/updateRoute/:id", authorizeAdmin,routeController.updateRoute); // Update route
Router.delete("/deleteRoute/:id",authorizeAdmin,routeController.deleteRoute); // Delete route


//bustracking
Router.post("/update-location",authenticateUser,authorizeDriver,busTrackingController.updateBusLocation)
// Router.get("/current-location/:busId", authenticateUser, busTrackingController.getBusHistory);

// ✅ Get tracking history of a bus
Router.get("/history/:busId", authenticateUser, busTrackingController.getBusHistory);
Router.get("/current-location/:busId", busTrackingController.getCurrentLocation);



//feedback//
Router.post("/submit-feedback",feedbackController.submitFeedback)
Router.get("/get-feedback",feedbackController.getFeedback)
Router.delete("/delete-feedback/:id",feedbackController.deletefeedbackById)
Router.get("/get-unread-feedback",authenticateUser,feedbackController.getUnreadFeedback)
Router.put("/mark-feedback-read/:id",authenticateUser,authorizeAdmin,feedbackController.markFeedbackread)

//admin send message(like holidays,etc)
Router.post("/send-message",authenticateUser, authorizeAdmin, messageController.sendMessage); // Admin only
Router.get("/messages",authenticateUser,messageController.getMessages);
Router.put("/messages/mark-as-read",authenticateUser,messageController.markMessagesAsRead)
Router.get("/messages/unread-count",authenticateUser,messageController.getUnreadMessageCount)
Router.delete("/delete/messages/:id",authenticateUser,authorizeAdmin,messageController.deleteMessage)




export default Router;


