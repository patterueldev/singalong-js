import { User, UserRole } from "singalong-shared";
import { UserRepository, RoomRepository } from "../db/repositories";
import { hashPassword, comparePassword, generateSessionToken } from "../utils/auth";

// In-memory session store (replace with Redis in production)
const sessions = new Map<string, { userId: string; createdAt: number }>();

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private roomRepo: RoomRepository
  ) {}

  async adminLogin(nickname: string, password: string): Promise<{ user: User; sessionToken: string }> {
    const user = await this.userRepo.findByNickname(nickname);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (user.role !== UserRole.ADMIN) {
      throw new Error("Not an admin user");
    }

    if (!user.passwordHash) {
      throw new Error("Admin must have password");
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const sessionToken = generateSessionToken();
    sessions.set(sessionToken, { userId: user.id, createdAt: Date.now() });

    // Update last activity
    await this.userRepo.update(user.id, { lastActivity: Date.now() });

    return { user, sessionToken };
  }

  async joinRoom(
    nickname: string,
    roomNumber: string,
    password?: string,
    roomPasscode?: string
  ): Promise<{ user: User; sessionToken: string }> {
    // Find room
    const room = await this.roomRepo.findByRoomNumber(roomNumber);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status === "ended") {
      throw new Error("Room has ended");
    }

    // Check room passcode
    if (room.passcodeProtected && room.passcode) {
      if (!roomPasscode) {
        throw new Error("Room passcode required");
      }
      const isValid = await comparePassword(roomPasscode, room.passcode);
      if (!isValid) {
        throw new Error("Invalid room passcode");
      }
    }

    // Check if user exists
    let user = await this.userRepo.findByNickname(nickname);

    if (user) {
      // User exists - verify password if they have one
      if (user.passwordHash) {
        if (!password) {
          throw new Error("Password required for this nickname");
        }
        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid password");
        }
      }

      // Check if already in same room
      if (user.roomId === room.id) {
        throw new Error("Already in this room");
      }

      // Update user's room
      await this.userRepo.update(user.id, {
        roomId: room.id,
        joinedAt: Date.now(),
        lastActivity: Date.now(),
      });
      user = { ...user, roomId: room.id, joinedAt: Date.now(), lastActivity: Date.now() };
    } else {
      // Create new user
      const passwordHash = password ? await hashPassword(password) : undefined;
      user = await this.userRepo.create({
        nickname,
        passwordHash,
        role: UserRole.USER,
        roomId: room.id,
        joinedAt: Date.now(),
        lastActivity: Date.now(),
        songHistory: [],
      });
    }

    const sessionToken = generateSessionToken();
    sessions.set(sessionToken, { userId: user.id, createdAt: Date.now() });

    return { user, sessionToken };
  }

  async validateSession(sessionToken: string): Promise<User | null> {
    const session = sessions.get(sessionToken);
    if (!session) {
      return null;
    }

    // Check if session expired (24 hours)
    if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
      sessions.delete(sessionToken);
      return null;
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user) {
      sessions.delete(sessionToken);
      return null;
    }

    // Update last activity
    await this.userRepo.update(user.id, { lastActivity: Date.now() });

    return user;
  }

  logout(sessionToken: string): void {
    sessions.delete(sessionToken);
  }
}
