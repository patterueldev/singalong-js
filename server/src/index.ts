import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

// Load environment variables
dotenv.config();

// Import database
import { connectToDatabase, getDatabase } from "./db/connection";

// Import repositories
import {
  RoomRepository,
  UserRepository,
  SongRepository,
  QueueRepository,
} from "./db/repositories";

// Import services
import { AuthService } from "./services/auth";
import { RoomService, SessionService } from "./services/room";
import { QueueService } from "./services/queue";
import { WebSocketService } from "./services/websocket";

// Import routes
import { createAuthRouter } from "./routes/auth";
import { createRoomRouter } from "./routes/rooms";
import { createQueueRouter } from "./routes/queue";

// Import middleware
import { initAuthMiddleware } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Load OpenAPI spec
const openApiSpec = YAML.load(path.join(__dirname, "openapi.yaml"));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Singalong Karaoke API Documentation",
}));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Initialize and start server
async function startServer() {
  try {
    // Connect to database
    const db = await connectToDatabase();
    console.log("✓ Database connected");

    // Initialize repositories
    const roomRepo = new RoomRepository(db);
    const userRepo = new UserRepository(db);
    const songRepo = new SongRepository(db);
    const queueRepo = new QueueRepository(db);

    // Initialize services
    const authService = new AuthService(userRepo, roomRepo);
    const roomService = new RoomService(roomRepo, userRepo);
    const sessionService = new SessionService(queueRepo, userRepo, roomRepo);
    const queueService = new QueueService(queueRepo, songRepo, roomRepo);

    // Initialize auth middleware
    initAuthMiddleware(authService);

    // Create HTTP server for WebSocket support
    const server = http.createServer(app);

    // Initialize WebSocket server
    const wss = new WebSocketServer({ server });
    const wsService = new WebSocketService(wss);
    console.log("✓ WebSocket service initialized");

    // Register routes
    app.use("/auth", createAuthRouter(authService));
    app.use("/rooms", createRoomRouter(roomService, sessionService));
    app.use("/queue", createQueueRouter(queueService));
    console.log("✓ Routes registered");

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error("Error:", err);
      res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal server error",
      });
    });

    // Start server
    server.listen(PORT, () => {
      console.log(`🎤 Singalong Server listening on http://localhost:${PORT}`);
      console.log(`📊 WebSocket server ready at ws://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM signal received: closing HTTP server");
      server.close(() => {
        console.log("HTTP server closed");
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
