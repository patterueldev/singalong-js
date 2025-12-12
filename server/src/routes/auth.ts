import { Router, Request, Response } from "express";
import { AuthService } from "../services/auth";
import { AuthLoginRequest, RoomJoinRequest } from "../models/api";

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  // Admin login
  router.post("/admin-login", async (req: Request, res: Response) => {
    try {
      const { nickname, password } = req.body as AuthLoginRequest;

      if (!nickname || !password) {
        return res.status(400).json({
          success: false,
          error: "Nickname and password required",
        });
      }

      const { user, sessionToken } = await authService.adminLogin(nickname, password);

      res.json({
        success: true,
        data: {
          sessionToken,
          userId: user.id,
          user: {
            id: user.id,
            nickname: user.nickname,
            role: user.role,
          },
        },
      });
    } catch (error: any) {
      console.error("Admin login error:", error);
      res.status(401).json({
        success: false,
        error: error.message || "Login failed",
      });
    }
  });

  // User join room
  router.post("/join-room", async (req: Request, res: Response) => {
    try {
      const { nickname, roomNumber, password, roomPasscode } = req.body;

      if (!nickname || !roomNumber) {
        return res.status(400).json({
          success: false,
          error: "Nickname and room number required",
        });
      }

      const { user, sessionToken } = await authService.joinRoom(
        nickname,
        roomNumber,
        password,
        roomPasscode
      );

      res.json({
        success: true,
        data: {
          sessionToken,
          userId: user.id,
          user: {
            id: user.id,
            nickname: user.nickname,
            role: user.role,
            roomId: user.roomId,
          },
        },
      });
    } catch (error: any) {
      console.error("Join room error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to join room",
      });
    }
  });

  // Logout
  router.post("/logout", (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        authService.logout(token);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Logout failed",
      });
    }
  });

  return router;
}
