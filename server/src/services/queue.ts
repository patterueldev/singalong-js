import { ReservedSong, Song } from "singalong-shared";
import { QueueRepository, SongRepository, RoomRepository } from "../db/repositories";

export class QueueService {
  constructor(
    private queueRepo: QueueRepository,
    private songRepo: SongRepository,
    private roomRepo: RoomRepository
  ) {}

  async addSongToQueue(
    roomId: string,
    songId: string,
    userId: string
  ): Promise<ReservedSong> {
    // Verify room exists and is active
    const room = await this.roomRepo.findById(roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    if (room.status === "ended") {
      throw new Error("Room has ended");
    }

    // Verify song exists
    const song = await this.songRepo.findById(songId);
    if (!song) {
      throw new Error("Song not found");
    }

    // Check current queue
    const queue = await this.queueRepo.findByRoomId(roomId);
    const isEmpty = queue.length === 0;

    // Create queue item
    const queueItem = await this.queueRepo.create({
      roomId,
      songId,
      reservedBy: userId,
      status: isEmpty ? "playing" : "pending", // If queue is empty, play immediately
      addedAt: Date.now(),
      startedAt: isEmpty ? Date.now() : undefined,
    });

    return queueItem;
  }

  async getQueue(roomId: string): Promise<ReservedSong[]> {
    return this.queueRepo.findByRoomId(roomId);
  }

  async playPause(queueItemId: string, userId: string, isAdmin: boolean): Promise<ReservedSong> {
    const item = await this.queueRepo.findById(queueItemId);
    if (!item) {
      throw new Error("Queue item not found");
    }

    // Check permissions
    if (!isAdmin && item.reservedBy !== userId) {
      throw new Error("Can only control your own songs");
    }

    // Toggle status
    const newStatus = item.status === "playing" ? "pending" : "playing";
    await this.queueRepo.update(queueItemId, { status: newStatus });

    return { ...item, status: newStatus };
  }

  async skipSong(queueItemId: string, userId: string, isAdmin: boolean): Promise<void> {
    const item = await this.queueRepo.findById(queueItemId);
    if (!item) {
      throw new Error("Queue item not found");
    }

    // Check permissions
    if (!isAdmin && item.reservedBy !== userId) {
      throw new Error("Can only skip your own songs");
    }

    // Mark as completed
    await this.queueRepo.update(queueItemId, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Start next song in queue
    const queue = await this.queueRepo.findByRoomId(item.roomId);
    const nextSong = queue.find(q => q.status === "pending");
    if (nextSong) {
      await this.queueRepo.update(nextSong.id, {
        status: "playing",
        startedAt: Date.now(),
      });
    }
  }

  async cancelSong(queueItemId: string, userId: string, isAdmin: boolean): Promise<void> {
    const item = await this.queueRepo.findById(queueItemId);
    if (!item) {
      throw new Error("Queue item not found");
    }

    // Check permissions
    if (!isAdmin && item.reservedBy !== userId) {
      throw new Error("Can only cancel your own songs");
    }

    if (item.status === "playing") {
      throw new Error("Cannot cancel currently playing song. Use skip instead.");
    }

    await this.queueRepo.update(queueItemId, {
      status: "cancelled",
      completedAt: Date.now(),
    });
  }

  async updateCurrentTime(queueItemId: string, currentTime: number): Promise<void> {
    await this.queueRepo.update(queueItemId, { currentTime });
  }
}
