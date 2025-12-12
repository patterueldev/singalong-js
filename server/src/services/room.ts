import { Room, User, Session, ReservedSong } from "singalong-shared";
import { RoomRepository, UserRepository, QueueRepository } from "../db/repositories";
import { generateRoomNumber, generateQRCode, hashPassword } from "../utils/auth";

export class RoomService {
  constructor(
    private roomRepo: RoomRepository,
    private userRepo: UserRepository
  ) {}

  async createRoom(
    adminNickname: string,
    adminPassword: string,
    roomPasscode?: string
  ): Promise<{ room: Room; admin: User }> {
    // Generate unique room number
    let roomNumber: string;
    let attempts = 0;
    do {
      roomNumber = generateRoomNumber();
      const existing = await this.roomRepo.findByRoomNumber(roomNumber);
      if (!existing) break;
      attempts++;
      if (attempts > 10) {
        throw new Error("Failed to generate unique room number");
      }
    } while (true);

    // Hash admin password
    const passwordHash = await hashPassword(adminPassword);

    // Create admin user
    const admin = await this.userRepo.create({
      nickname: adminNickname,
      passwordHash,
      role: "admin",
      songHistory: [],
    });

    // Create room
    const qrCode = generateQRCode(roomNumber, process.env.SERVER_URL || "http://localhost:3000");
    const room = await this.roomRepo.create({
      roomNumber,
      passcodeProtected: !!roomPasscode,
      passcode: roomPasscode ? await hashPassword(roomPasscode) : undefined,
      qrCode,
      createdBy: admin.id,
      createdAt: Date.now(),
      sessionStarted: false,
      status: "active",
    });

    // Update admin's room
    await this.userRepo.update(admin.id, { roomId: room.id, joinedAt: Date.now() });

    return { room, admin: { ...admin, roomId: room.id, joinedAt: Date.now() } };
  }

  async getRoomById(roomId: string): Promise<Room | null> {
    return this.roomRepo.findById(roomId);
  }

  async getRoomByRoomNumber(roomNumber: string): Promise<Room | null> {
    return this.roomRepo.findByRoomNumber(roomNumber);
  }

  async startSession(roomId: string, adminId: string): Promise<boolean> {
    const room = await this.roomRepo.findById(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.createdBy !== adminId) {
      throw new Error("Only room creator can start session");
    }

    if (room.sessionStarted) {
      throw new Error("Session already started");
    }

    return this.roomRepo.update(roomId, { sessionStarted: true });
  }

  async endRoom(roomId: string, adminId: string): Promise<boolean> {
    const room = await this.roomRepo.findById(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.createdBy !== adminId) {
      throw new Error("Only room creator can end room");
    }

    return this.roomRepo.update(roomId, { status: "ended" });
  }

  async getAllActiveRooms(): Promise<Room[]> {
    return this.roomRepo.findAllActive();
  }
}

export class SessionService {
  constructor(
    private queueRepo: QueueRepository,
    private userRepo: UserRepository,
    private roomRepo: RoomRepository
  ) {}

  async getSession(roomId: string): Promise<Session | null> {
    const room = await this.roomRepo.findById(roomId);
    if (!room) return null;

    const queue = await this.queueRepo.findByRoomId(roomId);
    const participants = await this.userRepo.findByRoomId(roomId);

    const currentSong = queue.find(item => item.status === "playing");

    return {
      roomId,
      currentSong,
      queue,
      participants,
      createdAt: room.createdAt,
      startedAt: room.sessionStarted ? room.createdAt : undefined,
    };
  }
}
