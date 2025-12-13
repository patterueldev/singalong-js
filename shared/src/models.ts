// Core Domain Models for Singalong Karaoke System

/**
 * User role types
 */
export enum UserRole {
  ADMIN = "admin",
  USER = "user"
}

/**
 * Room represents a karaoke session space
 * Each room has a 6-digit ID users can join with
 */
export interface Room {
  id: string;                    // UUID, PK
  roomNumber: string;            // 6-digit string (000000-999999), UNIQUE, user-facing
  passcodeProtected: boolean;    // If true, users must enter passcode to join
  passcode?: string;             // Only stored on server, never transmitted to clients (hashed)
  qrCode: string;                // QR code data/string for mobile scanning
  createdBy: string;             // Admin user ID who created the room
  createdAt: number;             // Timestamp (ms)
  sessionStarted: boolean;        // False until admin explicitly starts session
  status: "active" | "ended";    // Room active or closed
  atmosphere?: string;           // Optional: "weeb", "traditional", "pop", etc. for recommendations
}

/**
 * Session represents the current state of a karaoke session in a room
 * Contains queue, current song, and participant list
 */
export interface Session {
  roomId: string;                // FK to Room
  currentSong?: ReservedSong;    // Currently playing song (with timing info)
  queue: ReservedSong[];         // Full queue in order
  participants: User[];          // Connected users/admins
  createdAt: number;             // Session start timestamp
  startedAt?: number;            // When admin clicked "start"
}

/**
 * User represents a participant in a karaoke session
 */
export interface User {
  id: string;                    // UUID, PK, server-assigned
  nickname: string;              // UNIQUE globally across server
  passwordHash?: string;         // bcrypt hash; undefined = no password protection
  role: UserRole;                // Admin vs regular user
  roomId?: string;               // Current room ID (undefined = not in any room)
  joinedAt?: number;             // When user joined current room
  lastActivity?: number;         // Last action timestamp (for 10-min idle detection)
  sessionToken?: string;         // For player app auth (TBD exact mechanism)
  songHistory: string[];         // Array of song IDs sung in this room/session (for recommendations)
}

/**
 * Song represents a media item in the database
 * Can be from YouTube, Spotify, or local files
 */
export interface Song {
  id: string;                    // UUID or provider-specific ID, PK
  title: string;                 // Song title
  artist: string;                // Artist name
  duration: number;              // Duration in milliseconds
  language: string;              // Language code: "en", "ja", "tl", etc.
  fileUrl: string;               // URL to downloaded file (local path or S3)
  provider: string;              // Source: "youtube", "spotify", "local"
  providerId: string;            // ID from external provider
  lyrics?: string;               // Optional full lyrics text
  tags: string[];                // For indexing/categorization: ["weeb", "anime", "2000s"]
  metadata?: Record<string, any>; // JSON blob for provider-specific data
  createdAt: number;             // When added to database (timestamp ms)
  updatedAt: number;             // Last modification (timestamp ms)
}

/**
 * ReservedSong represents a song reserved by a user, part of the queue
 */
export interface ReservedSong {
  id: string;                    // UUID, PK
  roomId: string;                // FK to Room
  songId: string;                // FK to Song
  reservedBy: string;            // User ID who reserved this song
  status: "pending" | "playing" | "completed" | "cancelled";
  addedAt: number;               // When added to queue (timestamp ms)
  startedAt?: number;            // When playback started (timestamp ms)
  completedAt?: number;          // When song finished (timestamp ms)
  currentTime?: number;          // Current playback position in ms (for sync)
}

/**
 * SongDraft represents a pending song suggestion before finalization
 * User can edit metadata before "Download & Reserve"
 */
export interface SongDraft {
  id: string;                    // UUID, PK
  createdBy: string;             // User ID who initiated suggestion
  roomId?: string;               // Room context (optional, if created within a room)
  providerId: string;            // URL or ID from MediaProvider (e.g., YouTube URL)
  tempFilePath: string;          // Path to temporary downloaded file (local filesystem or temp storage)
  metadata: Partial<Song>;       // Draft metadata (user can edit)
  status: "pending" | "completed" | "cancelled";
  createdAt: number;             // When draft created (timestamp ms)
  expiresAt: number;             // Auto-delete after X hours if not finalized (timestamp ms)
}

/**
 * Represents metadata extracted from a MediaProvider
 * Used when fetching song details before full Song creation
 */
export interface SongMetadata {
  title: string;
  artist: string;
  duration: number;
  language?: string;
  providerId: string;
  provider: string;
  thumbnail?: string;
  url: string;
  metadata?: Record<string, any>;
}

/**
 * Represents a search result from MediaProvider (e.g., YouTube search)
 */
export interface MediaSearchResult {
  id: string;
  title: string;
  artist?: string;
  duration?: number;
  thumbnail?: string;
  url: string;
  provider: string;
}

/**
 * WebSocket event envelope for real-time communication
 */
export interface WebSocketEvent {
  type: string;                  // Event type: "playback_started", "queue_updated", etc.
  roomId: string;                // Room context
  payload: Record<string, any>;  // Event-specific data
  timestamp: number;             // Server timestamp (ms)
}

/**
 * API Response envelope for consistency
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination metadata in response
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
