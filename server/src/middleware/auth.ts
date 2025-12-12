import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth";
import { User } from "singalong-shared";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

let authService: AuthService;

export function initAuthMiddleware(service: AuthService) {
  authService = service;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);
    const user = await authService.validateSession(token);

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid or expired session" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ success: false, error: "Authentication failed" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Admin access required" });
  }

  next();
}
