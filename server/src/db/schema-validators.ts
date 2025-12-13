/**
 * Schema Validators
 * 
 * These functions validate that objects match the expected MongoDB schema
 * before insertion. This helps prevent field name inconsistencies without
 * requiring a full ODM like Mongoose.
 * 
 * See SCHEMA.md for full schema documentation.
 */

import { User, Room, Song, ReservedSong, SongDraft, UserRole } from "singalong-shared";

/**
 * Validates that a User object has all required MongoDB fields
 * Throws if validation fails
 */
export function validateUserDocument(user: Partial<User>): void {
  if (!user.nickname) {
    throw new Error("User must have nickname");
  }
  
  if (!user.role) {
    throw new Error("User must have role");
  }
  
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.USER) {
    throw new Error(`Invalid role: ${user.role}`);
  }
  
  // Validate that passwordHash is used, not password
  if ((user as any).password !== undefined) {
    throw new Error("Use 'passwordHash' field, not 'password'");
  }
}

/**
 * Validates that a Room object has all required MongoDB fields
 */
export function validateRoomDocument(room: Partial<Room>): void {
  if (!room.roomNumber) {
    throw new Error("Room must have roomNumber");
  }
  
  if (!/^\d{6}$/.test(room.roomNumber)) {
    throw new Error("roomNumber must be 6 digits");
  }
  
  if (room.passcodeProtected === undefined) {
    throw new Error("Room must have passcodeProtected boolean");
  }
  
  if (room.passcodeProtected && !room.passcode) {
    throw new Error("Passcode-protected room must have passcode");
  }
  
  if (!room.status || (room.status !== "active" && room.status !== "ended")) {
    throw new Error("Room must have valid status");
  }
}

/**
 * Validates that a Song object has all required MongoDB fields
 */
export function validateSongDocument(song: Partial<Song>): void {
  if (!song.title) {
    throw new Error("Song must have title");
  }
  
  if (!song.artist) {
    throw new Error("Song must have artist");
  }
  
  if (!song.duration || song.duration <= 0) {
    throw new Error("Song must have positive duration in milliseconds");
  }
  
  if (!song.fileUrl) {
    throw new Error("Song must have fileUrl");
  }
  
  if (!song.provider) {
    throw new Error("Song must have provider");
  }
  
  if (!song.providerId) {
    throw new Error("Song must have providerId");
  }
}

/**
 * Validates that a ReservedSong object has all required MongoDB fields
 */
export function validateQueueItemDocument(item: Partial<ReservedSong>): void {
  if (!item.roomId) {
    throw new Error("Queue item must have roomId");
  }
  
  if (!item.songId) {
    throw new Error("Queue item must have songId");
  }
  
  if (!item.reservedBy) {
    throw new Error("Queue item must have reservedBy");
  }
  
  const validStatuses = ["pending", "playing", "completed", "cancelled"];
  if (!item.status || !validStatuses.includes(item.status)) {
    throw new Error(`Queue item must have valid status: ${validStatuses.join(", ")}`);
  }
  
  if (!item.addedAt) {
    throw new Error("Queue item must have addedAt timestamp");
  }
}

/**
 * Validates that a SongDraft object has all required MongoDB fields
 */
export function validateSongDraftDocument(draft: Partial<SongDraft>): void {
  if (!draft.createdBy) {
    throw new Error("Song draft must have createdBy");
  }
  
  if (!draft.roomId) {
    throw new Error("Song draft must have roomId");
  }
  
  if (!draft.providerId) {
    throw new Error("Song draft must have providerId");
  }
  
  if (!draft.tempFilePath) {
    throw new Error("Song draft must have tempFilePath");
  }
  
  if (!draft.metadata) {
    throw new Error("Song draft must have metadata");
  }
  
  const validStatuses = ["pending", "completed", "cancelled"];
  if (!draft.status || !validStatuses.includes(draft.status)) {
    throw new Error(`Song draft must have valid status: ${validStatuses.join(", ")}`);
  }
}

/**
 * Sanitizes any object to ensure no incorrect field names are present
 * Returns a new object with only valid User fields
 */
export function sanitizeUserForDB(input: any): Partial<User> {
  const output: Partial<User> = {};
  
  const validFields = [
    "id",
    "nickname", 
    "passwordHash",
    "role",
    "roomId",
    "joinedAt",
    "lastActivity",
    "songHistory"
  ];
  
  for (const field of validFields) {
    if (input[field] !== undefined) {
      (output as any)[field] = input[field];
    }
  }
  
  // Specific check for common mistake
  if (input.password !== undefined && input.passwordHash === undefined) {
    throw new Error("Attempted to use 'password' field instead of 'passwordHash'");
  }
  
  return output;
}
