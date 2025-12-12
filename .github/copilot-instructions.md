# AI Coding Agent Instructions – Singalong Karaoke System (Starter)

This project implements a decentralized karaoke system with a local server and multiple client applications. The goal is to maintain modular, clean architecture so new features can be added without rewriting core logic.

## System Architecture

**The system consists of:**
- **Server (Node + TypeScript)** — runs locally on user's machine. Each user hosts their own server (NOT cloud-hosted).
- **Admin App (React Native + Expo)** — runs on web browser, iOS, and Android. Shows current song, queue, reservations, users, approvals.
- **Controller App (React Native + Expo)** — runs on web browser, iOS, and Android. For regular users with songbook search, reservations, queue status.
- **Player App (React Native + Expo)** — runs on web browser, iOS, iPadOS, Android, tvOS, macOS, and Windows natively. Displays currently playing video/media and song metadata.

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
  password?: string;             // Required for admins; optional for regular users
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
| **Admin** | Basic auth (nickname/password) | Required. Admin creates rooms, manages session, controls playback. Always password-protected (mandatory). |
| **Controller (User)** | Nickname + optional password (if user is regular) + optional room passcode | Regular users: optional password. Admins must use password when joining via controller (they should use admin app instead). Room may require passcode. |
| **Player** | Server-assigned token | Admin provisions player device (TBD how: QR, manual, etc.). No user input. |

**Key Pattern:**
- **Admin role:** Always password-protected. Authenticates via admin app with nickname/password. Can also join controller app but must provide password.
- User join flow (Controller): `nickname` (required) → `user password` (if user has one set) → `room passcode` (if room requires it)
- **Nickname uniqueness:** Global across server; admins always password-protected. Regular users with no password can be claimed by anyone.
- **One nickname per room at a time:** A nickname can only exist in one room simultaneously. If a non-password user tries to join a different room with their current nickname, access is denied until they leave the first room.
- **Password-protected nickname switching:** If a password-protected user tries to join a different room, their old session is automatically kicked out (useful for switching phones). Non-password users must manually leave first.
- **Nickname collision in same room:** If another user tries to join the same room with an already-taken nickname (and that user has no password), access is denied until: (1) the original user leaves, OR (2) the original user is idle for 10+ minutes (auto-disconnected)
- **User tracking:** All songs sung by a user are logged for future recommendation engine
- Player is **one-time setup** — admin authenticates player during room config (mechanism TBD)

## Permissions & Song Management

### User Actions
- **View:** Current song, queue, own reservations
- **Playback control:** Play/pause/skip **only their own** reserved or currently singing song
- **Queue management:** Cancel their own reserved songs ahead of time
- **Song selection:** Reserve existing songs from the database; add new songs not yet in database

### Admin Actions
- **All user actions:** Admins can perform everything regular users can do
- **Playback control:** Play/pause/skip **any song** currently playing (not just their own)
- **Queue management:** Cancel, reorder, or edit any song in the queue
- **Song management:** Edit song details; delete songs from database
- **User management:** Disconnect users from room; manage session state

### Song Approval Workflow
Songs are **automatically added to queue** when a user reserves or adds them. No approval step required.

## User Song Reservation & Queue Flow

### Song Reservation Process
1. **Song Book** — User browses songs in database
   - Search by title, artist, language, tags
   - See if song was already played in this room
   - Option to replay if desired
   - Click to reserve → added to queue

2. **Suggest Song** — If song not found
   - User types query → searches MediaProvider API
   - Results show: title, artist, duration, thumbnail
   - Indicators: "In Database", "Already in Queue", "Already Played"
   - Select song to proceed OR try different search

3. **Manual URL Entry** — User pastes direct link
   - Validate URL with MediaProvider
   - User can preview video (open in browser tab)
   - Fetch metadata via MediaProvider

4. **Enhancement Page** — Finalize song metadata
   - Pre-filled from MediaProvider (or OpenAI extraction)
   - User can edit: title, artist, language, lyrics, tags
   - Preview before confirming
   - Options: **Download Only** (add to DB) or **Download & Reserve** (add to DB + queue)

### Queue Logic
- **Empty Queue:** New song plays **immediately** (starts playback automatically)
- **Non-Empty Queue:** Song added to end of queue
- **User Controls:** Can play/pause/skip/remove **only their own** reserved song

### Duplicate Song Handling
- If song already in database → reuse existing entry
- If song already in queue → user prompted "This song is already reserved. Play again?"
- If song already played in room → user can still reserve (with notification)

## Player App Features

The Player App displays the currently playing song with:
- **Now Playing:** Video/media playback from MediaProvider
- **Score Display:** Show current singer's score (if applicable)
- **Scrolling Reservation List:** Floating overlay showing upcoming songs (right-to-left scroll, like traditional videoke)
- **User Session Stats:** List of all users currently in session with song count sung in this room/session
- **QR Code & Room ID:** Display QR code linking to room (can auto-fill room ID in Controller or require manual entry, TBD)

## Server Behavior & Scalability

### Room Capacity
- **Unlimited concurrent users** per room (practically, no hard limit enforced; assume <10K per room)

### Server Restart & State Recovery
- **Active rooms reload from database** on server startup
- **Playback resumes** from the current song state (with adjusted timestamps)
- **WebSocket connections re-establish** as clients reconnect
- **Queue & user state** restored from persistent storage
- No data loss for active sessions

## Key API Endpoints

### Room Management
- `POST /rooms` — Create room (admin auth required)
- `GET /rooms/:roomId` — Get room details
- `POST /rooms/:roomId/join` — Join room (nickname + optional passcode)
- `POST /rooms/:roomId/leave` — Leave room
- `POST /rooms/:roomId/start-session` — Start session (admin only)
- `POST /rooms/:roomId/end-session` — End session (admin only)

### Queue & Playback
- `GET /rooms/:roomId/queue` — Get full queue
- `GET /rooms/:roomId/current-song` — Get now playing
- `POST /rooms/:roomId/queue` — Add song to queue
- `PATCH /rooms/:roomId/queue/:queueItemId` — Reorder/edit queue item (admin only)
- `DELETE /rooms/:roomId/queue/:queueItemId` — Remove from queue
- `POST /rooms/:roomId/queue/:queueItemId/play` — Play song (admin or owner)
- `POST /rooms/:roomId/queue/:queueItemId/pause` — Pause song (admin or owner)
- `POST /rooms/:roomId/queue/:queueItemId/skip` — Skip song (admin or owner)

### Song Database
- `GET /songs/search?q=...` — Search existing songs
- `POST /songs` — Add new song to database
- `PATCH /songs/:songId` — Edit song details (admin only)
- `DELETE /songs/:songId` — Delete song (admin only)

### User Management
- `GET /rooms/:roomId/users` — Get users in room (with session stats)
- `POST /rooms/:roomId/users/:userId/disconnect` — Disconnect user (admin only)
- `PATCH /users/:userId` — Update user profile (set password, etc.)

## Admin Workflow & Room Setup

### Admin Session Flow
1. **Server Setup** — Admin starts server via Docker
2. **Access Admin App** — Web browser or native app (iOS/Android)
3. **Create Room** — Can be created in advance or immediately before session starts
   - Generates 6-digit room number + QR code
   - QR code stored (S3 or filesystem)
   - Room optionally passcode-protected
   - Room optionally has atmosphere/category for recommendations
4. **Assign Player(s)** — Select from available idle players
   - Only idle players (not actively assigned to another room) can be assigned
   - Multiple players can be assigned to same room
   - WebSocket tracks player connection status (idle vs. active)
5. **Start Session** — Admin explicitly starts the session
   - Players display QR code + room ID for users to scan/enter
   - Users begin connecting
6. **Manage During Session** — Admin controls playback, queue, volume
   - Play/pause/skip any song
   - Reorder/edit queue
   - Disconnect misbehaving users
7. **End Session & Close Room** — Admin ends session
   - Room must be explicitly closed; cannot be reused until closed
   - Admin can view list of active rooms anytime

### Player Assignment & Status
- **Idle State:** Player connected but not assigned to any room
- **Active State:** Player assigned to room, displaying QR + room ID
- **WebSocket Events:** Server broadcasts player status changes (idle → active, disconnection)
- **Hands-Free Design:** Player app has minimal UI; volume control available on Admin or Player UI

### Volume Control
- **Available On:** Player App, Admin App
- **Synced Via:** WebSocket (real-time sync across all connected clients)
- **Not Available On:** Controller App (users don't control volume)
- **Event:** `volume_changed` broadcast to all clients in room

## Client App UI Specifications

### Player App

**Single Screen Layout**

- **Idle Mode:** Looped background video plays continuously while waiting for room connection
- **Play Mode:** Full-screen video player displays the current song from the queue
  - When queue becomes empty, reverts to looped background video

**Layer Structure:**

1. **Player Layer** — Full-screen video playback
   - Displays current song from queue
   - Handles video scaling and aspect ratio
   - Reverts to looped background when queue is empty

2. **Scoring Screen Layer** — Full-screen overlay (when active)
   - Pops up after song finishes
   - Displays randomly-generated score (70-100)
   - Blocks interaction with player layer until dismissed
   - Future: integrate with real scoring system (details TBD)

3. **UI Overlays** — Always visible on top of active layer
   - **Top Overlay — Queue Display**
     - Shows upcoming songs in reservation list
     - Scrolls right-to-left (traditional videoke style)
     - Auto-scrolls if width exceeds screen; static if content fits
     - **First item (leftmost):** Currently playing song with 🎤 emoji indicator
     - **Following items:** Reserved songs in queue order
     - Each displays: song title, artist, nickname of who reserved it
   
   - **Bottom Overlay — Message Scroll**
     - Admin broadcasts PSA or messages to all users
     - Scrolling text (direction TBD)
     - Future feature; can be enhanced with styling/animations
   
   - **Bottom-Left Overlay — QR Code & Room ID**
     - Displays QR code linking to room
     - Room ID displayed below QR code (for manual entry)
     - Semi-transparent to not obstruct video

4. **Player Control Overlay** — Appears on interaction
   - Triggered by cursor movement (web) or remote button press (TV)
   - Auto-hides after inactivity
   - Contains: Play/Pause, Skip, Seek Bar, Volume Control, Mute
   - Synced with Admin App (volume/mute changes broadcast via WebSocket)

## Song Infrastructure

### Song Model
```ts
interface Song {
  id: string;                    // UUID, PK
  title: string;
  artist: string;
  duration: number;              // milliseconds
  language: string;              // e.g., "en", "ja", "tl"
  fileUrl: string;               // Link to downloaded file (S3 or local filesystem)
  provider: string;              // Source (e.g., "youtube", "spotify")
  providerId: string;            // ID from external provider
  lyrics?: string;               // Optional lyrics text
  tags: string[];                // For indexing/categorization (e.g., ["weeb", "anime", "2000s"])
  metadata: object;              // JSON blob for provider-specific data
  createdAt: number;
  updatedAt: number;
}

interface ReservedSong {
  id: string;                    // UUID, PK
  roomId: string;                // FK to room
  songId: string;                // FK to Song
  reservedBy: string;            // User ID
  status: "pending" | "playing" | "completed" | "cancelled";
  addedAt: number;
  startedAt?: number;
  completedAt?: number;
}
```

### Song Discovery Flow

**1. Song Book (Database Search)**
   - Display all songs in database
   - Filter/search by title, artist, language, tags
   - Show if song is already reserved (status, by whom)
   - Click to reserve → confirm → added to queue

**2. Suggest Song Screen (Media Provider Search)**
   - User types song query → calls MediaProvider API (YouTube, Spotify, etc.)
   - Display results with thumbnails
   - Show if song already exists in database
   - Show if song already in reservation list
   - Select song to proceed

**3. Manual URL Entry**
   - User pastes direct URL (YouTube, etc.)
   - Validate and fetch metadata via MediaProvider

**4. Enhancements Page**
   - Song metadata pre-filled from MediaProvider (or OpenAI extraction)
   - User can manually edit: title, artist, language, lyrics, tags
   - Preview file before confirming
   - **Download & Reserve** — adds to database and reserves immediately
   - **Download Only** — adds to database, user can reserve later

### Room Atmosphere & Recommendations
```ts
interface Room {
  // ... existing fields ...
  atmosphere?: string;           // Optional: "weeb", "traditional", "pop", etc.
}
```
- Helps recommendation engine suggest relevant songs (e.g., suggest Japanese songs for "weeb" rooms)
- Can be set by admin during room creation or updated later

### MediaProvider Pattern
The `MediaProvider` interface abstracts song fetching and metadata extraction:
```ts
interface MediaProvider {
  searchSongs(query: string): Promise<Song[]>;
  getSongMetadata(id: string): Promise<SongMetadata>;
  extractMetadata(url: string): Promise<SongMetadata>;  // For manual URL entry
}
```
Implementations (YouTube, Spotify, local files) go in `/server/media/[provider].ts`. Register new providers in `/server/media/registry.ts`.

### File Storage Strategy
- **Plain filesystem** (preferred): Store downloaded files in `/server/media/files/` or similar
- **S3-style** (alternative): Abstract behind a storage interface for future cloud migration
- Use content hashing (SHA256) of URL to avoid re-downloading duplicates

## Docker & Infrastructure

### Services Architecture
```yaml
docker-compose.yml contains:
- server          # Node.js backend (Express/Hono)
- admin-app       # React Native Expo (web browser)
- controller-app  # React Native Expo (web browser)
- mongodb         # Primary database
- minio           # S3-compatible object storage for song files
- cloudflared     # Tunnel for remote access (optional)
```

### Service Details

**Server**
- Port: `3000` (REST API)
- Depends on: MongoDB, MinIO
- Volumes: Song cache, logs
- Environment: DB connection, MinIO credentials, MediaProvider keys

**Admin & Controller Apps**
- Ports: `3001` (admin), `3002` (controller) — dev/built server
- Depends on: Server (network connectivity)
- Serves web UI via Expo bundler or production build

**MongoDB**
- Port: `27017`
- Volume: `/data/db` (persistent storage)
- Initialization: Auto-create indexes on startup

**MinIO**
- Port: `9000` (API), `9001` (console)
- Volume: `/data` (persistent object storage)
- Credentials: Set via environment variables
- Use for: Song file storage (S3-compatible API)

**Cloudflared** (Optional)
- Exposes server publicly via secure tunnel
- No direct port exposure
- Useful for: Remote room access, testing on real devices

### Local Development Setup
```bash
# Start all services
docker-compose up

# Rebuild after code changes
docker-compose up --build

# Access points:
# - Server API: http://localhost:3000
# - Admin app: http://localhost:3001
# - Controller app: http://localhost:3002
# - MinIO console: http://localhost:9001
# - MongoDB: mongodb://localhost:27017
```

### Environment Variables
Server needs:
- `MONGODB_URI` — connection string to MongoDB
- `MINIO_ENDPOINT` — MinIO API endpoint
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` — MinIO credentials
- `MEDIA_PROVIDER_API_KEY` — YouTube Data API key (if using YouTube provider)
- `OPENAI_API_KEY` — for song metadata extraction (optional)

## Database & Persistence

### Storage Strategy
- **SQLite or PostgreSQL** (TBD) — persistent local/networked storage for rooms, users, sessions
- **In-memory state** — active queue, current playback, live WebSocket connections (rebuilds on server restart)
- No migration framework required yet; schema evolution handled via server-side setup scripts

### Core Tables/Collections
```
rooms
  ├── id (UUID, PK)
  ├── roomNumber (6-digit string, UNIQUE) — user-facing room ID (000000-999999)
  ├── passcodeProtected (boolean)
  ├── passcode (encrypted string, nullable)
  ├── qrCode (string)
  ├── createdBy (user ID, FK)
  ├── createdAt (timestamp)
  ├── sessionStarted (boolean)
  └── status (enum: "active" | "ended")

users
  ├── id (UUID, PK)
  ├── nickname (string, UNIQUE globally)
  ├── password (hashed string, nullable)
  ├── role (enum: "admin" | "user")
  ├── roomId (FK to rooms, nullable — user in room or not)
  ├── joinedAt (timestamp)
  ├── lastActivity (timestamp — for idle detection)
  └── songHistory (array of song IDs)

songs (MediaProvider cache)
  ├── id (provider-specific ID, PK)
  ├── title (string)
  ├── artist (string)
  ├── duration (milliseconds)
  ├── provider (enum: "youtube" | "spotify" | etc.)
  └── metadata (JSON blob)

queue_items
  ├── id (UUID, PK)
  ├── roomId (FK)
  ├── songId (FK)
  ├── addedBy (user ID, FK)
  ├── status (enum: "pending" | "playing" | "completed")
  └── addedAt (timestamp)

reservations (user song requests, future feature)
  ├── id (UUID, PK)
  ├── roomId (FK)
  ├── userId (FK)
  ├── songId (FK)
  └── createdAt (timestamp)
```

### Query Patterns
- Find active rooms (status = "active")
- Find user by nickname (global lookup)
- Find all songs in queue for a room (ordered by addedAt)
- Find users idle >10 minutes (for auto-disconnect logic)
- Find user's song history (for recommendations)
- Check nickname availability in room

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

**Player App Specifics:**
- Also supports **tvOS, macOS and Windows** via React Native for TV/desktop platforms (for TV/display appliances)
- Can run as a standalone desktop app on consumer PCs/Macs/Apple TVs used as karaoke displays

### TypeScript & Code Style
- **Strict mode enabled** in `tsconfig.json` across all workspaces.
- Domain models (Song, User, Queue, Session) are defined in `/shared/models` and imported by both server and clients.
- Use explicit typing; avoid `any` except in legacy integration points.

## Real-Time Communication

Server emits events to all connected clients via WebSocket:
```ts
{
  type: string;       // event type
  roomId: string;     // room context
  payload: {...};     // event-specific data
  timestamp: number;  // server timestamp
}
```

### Critical Sync Events
These events are broadcast to all connected clients in a room and must be kept in sync across Player, Admin, and Controller apps:

1. **Playback Status**
   - `playback_started` — Song began playing
   - `playback_paused` — Song paused
   - `playback_resumed` — Song resumed
   - Payload: `{ songId, currentTime }`

2. **Seek Position**
   - `seek_changed` — User seeked to new position (via Player Controls or Admin)
   - Payload: `{ songId, seekTime }`

3. **Queue Updates**
   - `queue_updated` — Song added, removed, or reordered
   - `reservations_list_changed` — Updated list of all reserved songs
   - Payload: `{ queue: ReservedSong[] }`

4. **Current Song**
   - `song_changed` — Different song now playing
   - Payload: `{ songId, title, artist, reservedBy, startTime }`

5. **Volume Control**
   - `volume_changed` — Volume adjusted (from Player or Admin App)
   - `mute_toggled` — Mute state changed
   - Payload: `{ volume: number (0-100), isMuted: boolean }`

Clients subscribe to these events and update their UI accordingly. Admin App changes (e.g., skip, volume) are sent to server, which broadcasts to all clients for consistency.

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
