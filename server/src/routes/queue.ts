import { Router, Request, Response } from "express";
import { UserRole } from "singalong-shared";
import { QueueService } from "../services/queue";
import { authenticate } from "../middleware/auth";

export function createQueueRouter(queueService: QueueService): Router {
  const router = Router();

  // Add song to queue
  router.post("/:roomId/add", authenticate, async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const { songId } = req.body;

      if (!songId) {
        return res.status(400).json({
          success: false,
          error: "Song ID required",
        });
      }

      const queueItem = await queueService.addSongToQueue(roomId, songId, req.user!.id);

      res.json({
        success: true,
        data: { queueItem },
      });
    } catch (error: any) {
      console.error("Add to queue error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to add song to queue",
      });
    }
  });

  // Get queue
  router.get("/:roomId", authenticate, async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const queue = await queueService.getQueue(roomId);

      res.json({
        success: true,
        data: { queue },
      });
    } catch (error: any) {
      console.error("Get queue error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get queue",
      });
    }
  });

  // Play/pause song
  router.post("/:roomId/play-pause", authenticate, async (req: Request, res: Response) => {
    try {
      const { queueItemId } = req.body;

      if (!queueItemId) {
        return res.status(400).json({
          success: false,
          error: "Queue item ID required",
        });
      }

      const isAdmin = req.user!.role === UserRole.ADMIN;
      const queueItem = await queueService.playPause(queueItemId, req.user!.id, isAdmin);

      res.json({
        success: true,
        data: { queueItem },
      });
    } catch (error: any) {
      console.error("Play/pause error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to play/pause song",
      });
    }
  });

  // Skip song
  router.post("/:roomId/skip", authenticate, async (req: Request, res: Response) => {
    try {
      const { queueItemId } = req.body;

      if (!queueItemId) {
        return res.status(400).json({
          success: false,
          error: "Queue item ID required",
        });
      }

      const isAdmin = req.user!.role === UserRole.ADMIN;
      await queueService.skipSong(queueItemId, req.user!.id, isAdmin);

      res.json({
        success: true,
        data: { skipped: true },
      });
    } catch (error: any) {
      console.error("Skip error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to skip song",
      });
    }
  });

  // Cancel song
  router.post("/:roomId/cancel", authenticate, async (req: Request, res: Response) => {
    try {
      const { queueItemId } = req.body;

      if (!queueItemId) {
        return res.status(400).json({
          success: false,
          error: "Queue item ID required",
        });
      }

      const isAdmin = req.user!.role === UserRole.ADMIN;
      await queueService.cancelSong(queueItemId, req.user!.id, isAdmin);

      res.json({
        success: true,
        data: { cancelled: true },
      });
    } catch (error: any) {
      console.error("Cancel error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to cancel song",
      });
    }
  });

  // Update playback position
  router.post("/:roomId/seek", authenticate, async (req: Request, res: Response) => {
    try {
      const { queueItemId, currentTime } = req.body;

      if (!queueItemId || currentTime === undefined) {
        return res.status(400).json({
          success: false,
          error: "Queue item ID and current time required",
        });
      }

      await queueService.updateCurrentTime(queueItemId, currentTime);

      res.json({
        success: true,
        data: { updated: true },
      });
    } catch (error: any) {
      console.error("Seek error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to update seek position",
      });
    }
  });

  return router;
}
