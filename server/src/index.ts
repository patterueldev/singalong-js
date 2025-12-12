import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// TODO: Import and register routes
// import authRoutes from "./routes/auth";
// import roomRoutes from "./routes/rooms";
// import queueRoutes from "./routes/queue";
// import songsRoutes from "./routes/songs";
// import usersRoutes from "./routes/users";

// app.use("/auth", authRoutes);
// app.use("/rooms", roomRoutes);
// app.use("/queue", queueRoutes);
// app.use("/songs", songsRoutes);
// app.use("/users", usersRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  ws.on("message", (data) => {
    console.log("Received WebSocket message:", data);
    // TODO: Handle WebSocket messages
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🎤 Singalong Server listening on http://localhost:${PORT}`);
  console.log(`📊 WebSocket server ready at ws://localhost:${PORT}`);
});

export { app, wss };
