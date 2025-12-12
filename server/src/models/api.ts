// Server-specific models and API types
// Client models imported from singalong-shared

export interface AuthLoginRequest {
  nickname: string;
  password: string;
}

export interface AuthLoginResponse {
  sessionToken: string;
  userId: string;
  user: {
    id: string;
    nickname: string;
    role: "admin" | "user";
  };
}

export interface RoomJoinRequest {
  nickname: string;
  password?: string;
  roomPasscode?: string;
}

export interface RoomJoinResponse {
  sessionToken: string;
  userId: string;
  user: {
    id: string;
    nickname: string;
    role: "admin" | "user";
  };
}

export interface QueueItemUpdateRequest {
  order?: number;
  status?: "pending" | "playing" | "completed" | "cancelled";
}

export interface SongMetadataRequest {
  title: string;
  artist: string;
  language?: string;
  lyrics?: string;
  tags?: string[];
}

export interface SongSuggestionRequest {
  providerId: string; // YouTube URL or other provider ID
}

export interface SongFinalizeRequest {
  draftId: string;
  metadata: SongMetadataRequest;
  reserveImmediately?: boolean;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}
