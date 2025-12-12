import { WebSocket, WebSocketServer } from "ws";

export interface WebSocketMessage {
  type: string;
  roomId: string;
  payload: any;
  timestamp: number;
}

export interface WebSocketClient extends WebSocket {
  roomId?: string;
  userId?: string;
  isAlive?: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.setupServer();
  }

  private setupServer() {
    this.wss.on("connection", (ws: WebSocketClient) => {
      console.log("New WebSocket connection");
      ws.isAlive = true;

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as any;
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("WebSocket message parse error:", error);
          ws.send(JSON.stringify({ type: "error", error: "Invalid message format" }));
        }
      });

      ws.on("close", () => {
        console.log("WebSocket connection closed");
        if (ws.userId) {
          this.clients.delete(ws.userId);
        }
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });

    // Heartbeat to detect broken connections
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocketClient) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on("close", () => {
      clearInterval(interval);
    });
  }

  private handleMessage(ws: WebSocketClient, message: any) {
    switch (message.type) {
      case "register":
        // Register client with user and room info
        ws.userId = message.userId;
        ws.roomId = message.roomId;
        if (ws.userId) {
          this.clients.set(ws.userId, ws);
        }
        ws.send(JSON.stringify({ type: "registered", success: true }));
        break;

      case "ping":
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        break;

      default:
        console.log("Unknown message type:", message.type);
    }
  }

  // Broadcast to all clients in a room
  broadcast(roomId: string, message: WebSocketMessage) {
    const payload = JSON.stringify(message);
    this.wss.clients.forEach((client: WebSocketClient) => {
      if (client.roomId === roomId && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  // Send to specific user
  sendToUser(userId: string, message: any) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  // Emit playback events
  emitPlaybackStarted(roomId: string, songId: string, currentTime: number) {
    this.broadcast(roomId, {
      type: "playback_started",
      roomId,
      payload: { songId, currentTime },
      timestamp: Date.now(),
    });
  }

  emitPlaybackPaused(roomId: string, songId: string, currentTime: number) {
    this.broadcast(roomId, {
      type: "playback_paused",
      roomId,
      payload: { songId, currentTime },
      timestamp: Date.now(),
    });
  }

  emitPlaybackResumed(roomId: string, songId: string, currentTime: number) {
    this.broadcast(roomId, {
      type: "playback_resumed",
      roomId,
      payload: { songId, currentTime },
      timestamp: Date.now(),
    });
  }

  emitSeekChanged(roomId: string, songId: string, seekTime: number) {
    this.broadcast(roomId, {
      type: "seek_changed",
      roomId,
      payload: { songId, seekTime },
      timestamp: Date.now(),
    });
  }

  emitQueueUpdated(roomId: string, queue: any[]) {
    this.broadcast(roomId, {
      type: "queue_updated",
      roomId,
      payload: { queue },
      timestamp: Date.now(),
    });
  }

  emitSongChanged(roomId: string, song: any) {
    this.broadcast(roomId, {
      type: "song_changed",
      roomId,
      payload: song,
      timestamp: Date.now(),
    });
  }

  emitUserJoined(roomId: string, user: any) {
    this.broadcast(roomId, {
      type: "user_joined",
      roomId,
      payload: { userId: user.id, nickname: user.nickname },
      timestamp: Date.now(),
    });
  }

  emitUserLeft(roomId: string, userId: string) {
    this.broadcast(roomId, {
      type: "user_left",
      roomId,
      payload: { userId },
      timestamp: Date.now(),
    });
  }

  emitVolumeChanged(roomId: string, volume: number) {
    this.broadcast(roomId, {
      type: "volume_changed",
      roomId,
      payload: { volume },
      timestamp: Date.now(),
    });
  }

  emitMuteToggled(roomId: string, isMuted: boolean) {
    this.broadcast(roomId, {
      type: "mute_toggled",
      roomId,
      payload: { isMuted },
      timestamp: Date.now(),
    });
  }

  emitBroadcastMessage(roomId: string, message: string) {
    this.broadcast(roomId, {
      type: "broadcast_message",
      roomId,
      payload: { message, sender: "admin" },
      timestamp: Date.now(),
    });
  }
}
