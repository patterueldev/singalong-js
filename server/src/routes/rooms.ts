import { Router, Request, Response } from "express";
import { RoomService, SessionService } from "../services/room";
import { authenticate, requireAdmin } from "../middleware/auth";

export function createRoomRouter(
  roomService: RoomService,
  sessionService: SessionService
): Router {
  const router = Router();

  // Create room (admin only)
  router.post("/", async (req: Request, res: Response) => {
    try {
      const { adminNickname, adminPassword, roomPasscode } = req.body;

      if (!adminNickname || !adminPassword) {
        return res.status(400).json({
          success: false,
          error: "Admin nickname and password required",
        });
      }

      const { room, admin } = await roomService.createRoom(
        adminNickname,
        adminPassword,
        roomPasscode
      );

      res.json({
        success: true,
        data: { room, admin },
      });
    } catch (error: any) {
      console.error("Create room error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to create room",
      });
    }
  });

  // Get room by ID
  router.get("/:roomId", authenticate, async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const room = await roomService.getRoomById(roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      res.json({
        success: true,
        data: { room },
      });
    } catch (error: any) {
      console.error("Get room error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get room",
      });
    }
  });

  // Get room by room number
  router.get("/by-number/:roomNumber", async (req: Request, res: Response) => {
    try {
      const { roomNumber } = req.params;
      const room = await roomService.getRoomByRoomNumber(roomNumber);

      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Don't return sensitive info like passcode
      const { passcode, ...safeRoom } = room;

      res.json({
        success: true,
        data: { room: safeRoom },
      });
    } catch (error: any) {
      console.error("Get room by number error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get room",
      });
    }
  });

  // Start session
  router.post("/:roomId/start-session", authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const success = await roomService.startSession(roomId, req.user!.id);

      res.json({
        success: true,
        data: { started: success },
      });
    } catch (error: any) {
      console.error("Start session error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to start session",
      });
    }
  });

  // End room
  router.post("/:roomId/end", authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const success = await roomService.endRoom(roomId, req.user!.id);

      res.json({
        success: true,
        data: { ended: success },
      });
    } catch (error: any) {
      console.error("End room error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to end room",
      });
    }
  });

  // Get session state
  router.get("/:roomId/session", authenticate, async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const session = await sessionService.getSession(roomId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
        });
      }

      res.json({
        success: true,
        data: { session },
      });
    } catch (error: any) {
      console.error("Get session error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get session",
      });
    }
  });

  // List all active rooms
  router.get("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
      const rooms = await roomService.getAllActiveRooms();

      res.json({
        success: true,
        data: { rooms },
      });
    } catch (error: any) {
      console.error("List rooms error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to list rooms",
      });
    }
  });

  return router;
}
