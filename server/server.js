import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import Router from "./routes/routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Middleware

// Add this to your server setup
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Attach Socket.io to Express app
app.set("io", io);

// Routes
app.use("/api", Router);

// WebSocket Connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle admin message broadcast
  socket.on("sendMessage", (message) => {
    console.log("Admin Message:", message);
    io.emit("receiveMessage", message); // Send message to all users
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`🚀 Server started on PORT ${port}`);
});
