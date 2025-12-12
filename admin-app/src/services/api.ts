import { Room, User, Song, ReservedSong } from "singalong-shared";

class ApiService {
  private baseUrl: string;
  private sessionToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setSessionToken(token: string | null) {
    this.sessionToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(this.sessionToken && { Authorization: `Bearer ${this.sessionToken}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async adminLogin(nickname: string, password: string): Promise<{ user: User; sessionToken: string }> {
    return this.request("/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ nickname, password }),
    });
  }

  async logout(): Promise<void> {
    return this.request("/auth/logout", { method: "POST" });
  }

  // Rooms
  async createRoom(
    adminNickname: string,
    adminPassword: string,
    roomPasscode?: string
  ): Promise<{ room: Room; admin: User }> {
    return this.request("/rooms", {
      method: "POST",
      body: JSON.stringify({ adminNickname, adminPassword, roomPasscode }),
    });
  }

  async getRoom(roomId: string): Promise<Room> {
    return this.request(`/rooms/${roomId}`);
  }

  async startSession(roomId: string): Promise<{ success: boolean }> {
    return this.request(`/rooms/${roomId}/start-session`, { method: "POST" });
  }

  async endRoom(roomId: string): Promise<{ success: boolean }> {
    return this.request(`/rooms/${roomId}/end`, { method: "POST" });
  }

  async getSession(roomId: string): Promise<Room> {
    return this.request(`/rooms/${roomId}/session`);
  }

  // Queue
  async addSongToQueue(
    roomId: string,
    songId: string
  ): Promise<{ queueItem: ReservedSong }> {
    return this.request(`/queue/${roomId}/add`, {
      method: "POST",
      body: JSON.stringify({ songId }),
    });
  }

  async getQueue(roomId: string): Promise<{ queue: ReservedSong[] }> {
    return this.request(`/queue/${roomId}`);
  }

  async playPause(
    roomId: string,
    queueItemId: string
  ): Promise<{ queueItem: ReservedSong }> {
    return this.request(`/queue/${roomId}/play-pause`, {
      method: "POST",
      body: JSON.stringify({ queueItemId }),
    });
  }

  async skipSong(
    roomId: string,
    queueItemId: string
  ): Promise<{ success: boolean }> {
    return this.request(`/queue/${roomId}/skip`, {
      method: "POST",
      body: JSON.stringify({ queueItemId }),
    });
  }

  async cancelSong(
    roomId: string,
    queueItemId: string
  ): Promise<{ success: boolean }> {
    return this.request(`/queue/${roomId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ queueItemId }),
    });
  }

  async seekTo(
    roomId: string,
    queueItemId: string,
    seekTime: number
  ): Promise<{ success: boolean }> {
    return this.request(`/queue/${roomId}/seek`, {
      method: "POST",
      body: JSON.stringify({ queueItemId, seekTime }),
    });
  }
}

export default ApiService;
