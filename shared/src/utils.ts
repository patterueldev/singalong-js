// Shared utility functions used across server and client apps

import { User, Room, ReservedSong, Song, UserRole } from "./models";

/**
 * Generate a 6-digit room number (000000-999999)
 */
export function generateRoomNumber(): string {
  const num = Math.floor(Math.random() * 1000000);
  return num.toString().padStart(6, "0");
}

/**
 * Check if a room number is valid format
 */
export function isValidRoomNumber(roomNumber: string): boolean {
  return /^\d{6}$/.test(roomNumber);
}

/**
 * Format song duration for display (mm:ss)
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format timestamp as readable string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Check if user is idle (no activity for 10+ minutes)
 */
export function isUserIdle(user: User, thresholdMs: number = 10 * 60 * 1000): boolean {
  if (!user.lastActivity) return false;
  const now = Date.now();
  return now - user.lastActivity > thresholdMs;
}

/**
 * Filter songs by search query (case-insensitive)
 */
export function filterSongs(songs: Song[], query: string): Song[] {
  const q = query.toLowerCase();
  return songs.filter(
    (song) =>
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}

/**
 * Sort reserved songs by queue order and status
 */
export function sortQueueItems(items: ReservedSong[]): ReservedSong[] {
  return items.sort((a, b) => a.addedAt - b.addedAt);
}

/**
 * Get the next song in queue (first pending song)
 */
export function getNextQueueItem(queue: ReservedSong[]): ReservedSong | undefined {
  const sorted = sortQueueItems(queue);
  return sorted.find((item) => item.status === "pending");
}

/**
 * Get all songs by a specific user in a room
 */
export function getSongsByUser(queue: ReservedSong[], userId: string): ReservedSong[] {
  return queue.filter((item) => item.reservedBy === userId);
}

/**
 * Check if a song is already in queue
 */
export function isSongInQueue(queue: ReservedSong[], songId: string): boolean {
  return queue.some((item) => item.songId === songId && item.status !== "cancelled");
}

/**
 * Count songs currently playing or pending
 */
export function getActiveQueueCount(queue: ReservedSong[]): number {
  return queue.filter((item) => item.status === "pending" || item.status === "playing").length;
}

/**
 * Generate a QR code data string (simplified; in production, use qrcode library)
 * Format: singalong://room/{roomNumber}
 */
export function generateQRCodeData(roomNumber: string): string {
  return `singalong://room/${roomNumber}`;
}

/**
 * Parse a room ID from QR code data
 */
export function parseQRCodeRoomNumber(qrData: string): string | null {
  const match = qrData.match(/singalong:\/\/room\/(\d{6})/);
  return match ? match[1] : null;
}

/**
 * Check if user can control playback of a song (admin or owner)
 */
export function canUserControlPlayback(user: User, reservedSong: ReservedSong): boolean {
  return user.role === UserRole.ADMIN || user.id === reservedSong.reservedBy;
}

/**
 * Get user's current reservations in a room (excluding cancelled)
 */
export function getUserReservations(queue: ReservedSong[], userId: string): ReservedSong[] {
  return queue.filter((item) => item.reservedBy === userId && item.status !== "cancelled");
}

/**
 * Calculate estimated time until a user's song plays (sum of durations before it)
 */
export function estimateTimeUntilSong(
  queue: ReservedSong[],
  targetSongId: string,
  songs: Map<string, Song>
): number {
  const sorted = sortQueueItems(queue);
  let totalMs = 0;

  for (const item of sorted) {
    if (item.songId === targetSongId) break;
    if (item.status === "pending") {
      const song = songs.get(item.songId);
      if (song) totalMs += song.duration;
    }
  }

  return totalMs;
}
