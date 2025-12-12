# AI Coding Agent Instructions – Singalong Karaoke System (Starter)

This project implements a decentralized karaoke system with a local server and multiple client applications. The goal is to maintain modular, clean architecture so new features can be added without rewriting core logic.

## System Architecture

**The system consists of:**
- **Server (Node + TypeScript)** — runs locally on user's machine. Each user hosts their own server (NOT cloud-hosted).
- **Admin App (React Native + Expo)** — runs on web browser, iOS, and Android. Shows current song, queue, reservations, users, approvals.
- **Controller App (React Native + Expo)** — runs on web browser, iOS, and Android. For regular users with songbook search, reservations, queue status.
- **Player App (React Native + Expo)** — runs on web browser, iOS, and Android. Displays currently playing video/media and song metadata.

## Infrastructure & Session Model

### Room Lifecycle
- **Admin creates a room** → generates 6-digit room number + QR code
- **Admin joins the room** → gains full management access
- **Admin starts session** (optional during room creation, or anytime after)
- **Users/Controllers join the room** → enter nickname + optional passcode → see dashboard and songbook
- **Player app joins** → displays currently playing song (auth managed by admin)
- **Room ends** → admin closes session, all clients disconnect

### Room Structure
```ts
interface Room {
  id: string;                    // 6-digit room number (e.g., "482916")
  passcodeProtected: boolean;    // If true, users must enter passcode
  passcode?: string;             // Only stored on server, never transmitted to clients
  qrCode: string;                // QR string/data for mobile scanning
  createdBy: string;             // Admin ID
  createdAt: number;             // Timestamp
  sessionStarted: boolean;        // False until admin starts
  status: "active" | "ended";    // Room active or closed
}

interface Session {
  roomId: string;
  currentSong?: Song;            // Now playing
  queue: Queue;                  // All queued songs
  reservations: Reservation[];   // User song requests
  participants: User[];          // Connected users/admins
  createdAt: number;
  startedAt?: number;
}

interface User {
  id: string;                    // Server-assigned, unique globally
  nickname: string;              // Unique globally across all rooms
  password?: string;             // Optional; if set, user "owns" the nickname
  role: "admin" | "user";        // Admin vs regular user
  roomId: string;
  joinedAt: number;
  sessionToken?: string;         // For player app auth (TBD)
  songHistory: string[];         // Track songs sung for future recommendations
}
```

### Authentication & Access Control

| App | Auth Type | Details |
|-----|-----------|---------|
| **Admin** | Basic auth (username/password) | Required. Admin creates rooms, manages session, controls playback. Credentials stored locally on server. |
| **Controller (User)** | Nickname + optional user password + optional room passcode | Nickname unique globally. User can optionally set a password to "own" the nickname (default: no password). Room may require passcode. |
| **Player** | Server-assigned token | Admin provisions player device (TBD how: QR, manual, etc.). No user input. |

**Key Pattern:**
- Admin auth happens **once per session** — unlocks full room management
- User join flow: `nickname` (required) → `user password` (if user has one set) → `room passcode` (if room requires it)
- **Nickname uniqueness:** Global across server; if user has no password, anyone can claim it. If user sets password, only they can use that nickname.
- **Nickname collision in room:** If another user tries to join with an already-taken nickname (and that user has no password), access is denied until: (1) the original user leaves the room, OR (2) the original user is idle for 10+ minutes (auto-disconnected)
- **User tracking:** All songs sung by a user are logged for future recommendation engine
- Player is **one-time setup** — admin authenticates player during room config (mechanism TBD)

## Project Structure & Conventions

### Monorepo Organization
```
singalong-js/
├── server/              # Node.js backend
│   ├── routes/         # Express/Hono route handlers
│   ├── services/       # Business logic (queue mgmt, session state)
│   ├── models/         # TypeScript interfaces (Song, Queue, User, etc.)
│   ├── media/          # MediaProvider implementations
│   ├── session/        # Session manager, queue handler, event dispatcher
│   └── index.ts        # Server entry point
├── admin-app/          # React Native + Expo (web, iOS, Android)
├── controller-app/     # React Native + Expo (web, iOS, Android)
├── player-app/         # React Native + Expo (web, iOS, Android) - displays video/media
├── shared/             # TypeScript types used across all apps
└── package.json        # Monorepo root (npm workspaces)
```

### Cross-Platform Client Architecture
Both clients are built with **React Native + Expo + react-native-web**:
- **Single codebase** runs on web browsers, iOS, and Android
- Use `react-native-web` for browser rendering, native modules for iOS/Android
- **React Navigation** for cross-platform routing
- Responsive layouts adapt automatically: desktop (larger screens), tablet, mobile
- No separate "web" and "native" versions to maintain

### TypeScript & Code Style
- **Strict mode enabled** in `tsconfig.json` across all workspaces.
- Domain models (Song, User, Queue, Session) are defined in `/shared/models` and imported by both server and clients.
- Use explicit typing; avoid `any` except in legacy integration points.

### Real-Time Communication
Server emits events to all connected clients via WebSocket:
```ts
{
  type: "queue_updated" | "song_started" | "song_finished" | "user_joined" | "reservation_added" | "session_ended";
  payload: {...};  // event-specific data
  timestamp: number;
}
```

Clients subscribe to events in the `services/websocket.ts` layer (or equivalent).

## Admin App: Single Responsive Codebase

The Admin App uses **one React codebase** that adapts to different screen sizes:
- **Desktop (≥768px)**: Multi-panel grid layout with multiple screens visible simultaneously (Queue, Users, Reservations, etc.)
- **Mobile (<768px)**: Tab-based navigation with one screen at a time

**Structure:**
```
admin-app/
├── screens/        # Individual screens (Queue, Users, Reservations, Approvals, etc.)
├── layouts/
│   ├── DesktopLayout.tsx    # Multi-column grid, shows all panels
│   ├── MobileLayout.tsx     # Tabbed interface, one screen at a time
│   └── RootLayout.tsx       # Detects viewport and chooses layout
├── hooks/
│   └── useResponsive.ts     # Detects mobile/desktop based on viewport
└── components/
    └── ScreenCard.tsx       # Wraps each screen (handles borders, scrolling)
```

**Key Pattern:**
- Use a single responsive hook (`useResponsive()`) that returns `isMobile: boolean`
- All screens share the same data/WebSocket subscriptions — no duplication
- Layout composition changes based on screen size, not separate apps
- Tabbed navigation on mobile can use React Router params or a context-based tab state

### Adding a New Server Endpoint
1. Define request/response types in `/server/models/api.ts`
2. Add handler in `/server/routes/[feature].ts`
3. Update `/shared/models` if response type is used by clients
4. Emit WebSocket event from the handler if it affects client state

### Adding a New Client Feature
1. Create container component in `/[app]/screens/[feature]`
2. Import types from `/shared/models`
3. Call server API via `/[app]/services/api.ts`
4. Subscribe to relevant WebSocket events in `useEffect`

### Testing Server Logic
- Unit tests for service logic live in `/server/services/__tests__`
- Use Jest and mock queue/session state; avoid integration tests for now

## MediaProvider Pattern
The `MediaProvider` interface abstracts song fetching and metadata extraction:
```ts
interface MediaProvider {
  searchSongs(query: string): Promise<Song[]>;
  getSongMetadata(id: string): Promise<SongMetadata>;
}
```
Implementations (YouTube, Spotify, local files) go in `/server/media/[provider].ts`. Register new providers in `/server/media/registry.ts`.

## Development Guidelines
- **No global state outside of session/services** — React components should read from server, not local Redux/Context.
- **Event-driven architecture** — server state changes broadcast via WebSocket; clients listen and re-fetch if needed.
- **Validate at server layer** — clients trust server data but server validates all user inputs.
- **Avoid bidirectional sync** — only server→client updates via WebSocket; client→server is explicit REST calls.

## Common Pitfalls to Avoid
- ❌ Caching client-side user/queue state without server refresh
- ❌ Modifying session state outside of `/session/manager.ts`
- ❌ Hardcoding MediaProvider logic instead of using the pluggable interface
- ❌ Mixing async operations without proper error handling in React useEffect
