# AI Coding Agent Instructions – Singalong Karaoke System

**Decentralized karaoke system** where users host their own servers locally. Built with Node.js (Express), React Native (Expo), TypeScript, MongoDB, and MinIO.

## ⚠️ CRITICAL: Package Manager

**ALWAYS USE `pnpm` - NEVER USE `npm` or `yarn`**

This is a monorepo managed with pnpm workspaces. All commands MUST use `pnpm`:
- ✅ `pnpm install`
- ✅ `pnpm run dev`
- ✅ `pnpm run build`
- ✅ `pnpm run test`
- ✅ `pnpm add <package>` (in specific workspace)
- ❌ NEVER: `npm install`, `npm run`, etc.

To run commands in specific workspaces:
```bash
pnpm --filter server run dev          # Run dev in server workspace
pnpm --filter admin-app run start     # Run start in admin-app workspace
pnpm run dev --workspace server       # Alternative syntax
```

## Quick Start for Agents

### Architecture at a Glance

```
Server (Node.js + Express + WebSocket)
├── 4 Client Apps (React Native + Expo):
│   ├── Admin App (web, iOS, Android) — room/queue/user management, responsive design
│   ├── Controller App (web, iOS, Android) — user song discovery & reservations
│   ├── Player App (web, iOS, Android, tvOS, macOS, Windows) — displays now-playing
│   └── (Each runs independently, synced via WebSocket)
└── MongoDB + MinIO for persistence & file storage
```

### Monorepo Structure (npm workspaces)
- **`server/src/`** — Express app, routes (stubs), models, session management
- **`shared/src/`** — Domain models (Room, User, Song, Queue) + utilities used by all
- **`ui-library/`** — Reusable React Native components
- **`{admin,controller,player}-app/`** — Client apps using Expo

### Commands
```bash
pnpm install                    # Install all dependencies
docker-compose up               # Start all services (server: 3000, admin: 3001, controller: 3002, player: 3003)
pnpm run dev --workspace server # Start server in dev mode
pnpm run build --workspaces     # Build all workspaces
pnpm run test --workspaces      # Test all workspaces
```

### Critical Design Patterns

**1. Room Lifecycle**
- Admin creates room (generates 6-digit room number + QR code)
- Admin starts session → players display QR code → users join via Controller
- All clients sync via WebSocket; server is source of truth
- Room ends when admin closes it

**2. Authentication Model**
- **Admin:** nickname + password (required, password-protected always)
- **User (Controller):** nickname + optional password + optional room passcode
- **Player:** server-assigned token (no user input)
- **Key rule:** Nicknames are globally unique; one nickname per room at a time

**3. Queue & Song Flow**
- Users reserve songs from database → added to queue automatically (no approval)
- Empty queue → first song plays immediately
- Non-empty queue → song queued at end
- User can only play/pause/skip their own song; admins can control any song
- Song suggestion flow: URL → MediaProvider metadata extraction → OpenAI enhancement → user review → finalize

**4. WebSocket Events (Critical for Sync)**
All these must be broadcast to all clients in room:
- `playback_started`, `playback_paused`, `playback_resumed` (payload: songId, currentTime)
- `seek_changed` (payload: songId, seekTime)
- `queue_updated`, `reservations_list_changed` (payload: queue array)
- `song_changed` (payload: songId, title, artist, reservedBy, startTime)
- `volume_changed`, `mute_toggled` (payload: volume, isMuted)

**5. Shared Type System**
- Domain models defined in `/shared/src/models.ts` (Room, User, Song, Session, etc.)
- Both server and clients import from `/shared` to ensure consistency
- API request/response types in `/server/src/models/api.ts`
- No API serialization inconsistencies; strict TypeScript across all workspaces

## Key File Locations

| Purpose | Location |
|---------|----------|
| Domain models (Room, User, Song, Queue) | `shared/src/models.ts` |
| Server entry point | `server/src/index.ts` |
| API types (requests/responses) | `server/src/models/api.ts` |
| Planned route stubs | `server/src/routes/` (TODO) |
| Room/queue/session business logic | `server/src/services/` (TODO) |
| Song discovery & metadata extraction | `server/src/media/` (TODO) |
| Admin app screens | `admin-app/screens/` (TODO) |
| Controller app screens | `controller-app/screens/` (TODO) |
| Player app layers | `player-app/screens/` (TODO) |
| Shared components | `ui-library/src/components/` |
| Docker services config | `docker-compose.yml` |
| Development helper scripts | `scripts/dev.sh` |

## Implementation Priorities

**Phase 1: Server Core (In Progress)**
1. Implement room management routes (`POST /rooms`, `GET /rooms/:roomId`, `POST /rooms/:roomId/start-session`)
2. Implement user authentication (admin login, user join room)
3. Implement basic queue operations (add song, get queue, play/pause/skip)
4. Set up MongoDB collections (rooms, users, songs, queue_items)
5. Set up WebSocket event dispatcher

**Phase 2: Client Apps**
6. Admin app: responsive layout (desktop multi-panel, mobile tabs) with room dashboard
7. Controller app: song search, suggestion, queue view, reservations
8. Player app: 4-layer architecture (video, scoring overlay, UI overlays, controls)

**Phase 3: Song Infrastructure**
9. MediaProvider abstraction (YouTube integration first)
10. Song suggestion flow (URL → OpenAI enhancement → database)
11. Song search in local database

**Phase 4: Advanced Features**
12. Recommendation engine (room atmosphere + song history)
13. Scoring system (post-song score display)
14. Multi-player assignment
15. Broadcast messaging to Player

## Development Workflow When Adding Features

### Adding a Server Endpoint
1. Define request/response types in `server/src/models/api.ts`
2. Create handler in `server/src/routes/[feature].ts` (create file if doesn't exist)
3. Validate input at server layer (never trust client)
4. If endpoint changes shared state (queue, room), emit WebSocket event from handler
5. Update `server/src/index.ts` to register route: `app.use("/route-path", routeHandler)`
6. If response type used by clients, add/update in `shared/src/models.ts`

### Adding a Client Feature
1. Create screen in `[app]/screens/[feature].tsx`
2. Import types from `/shared/src/models.ts`
3. Create API calls in `[app]/services/api.ts` (POST/GET/etc. to server)
4. Subscribe to relevant WebSocket events in `useEffect` (listen for state changes)
5. Render based on state; call API to send user actions
6. Use components from `/ui-library/src/components/` (Button, Modal, etc.)

### Room State Management Pattern
- **Source of truth:** Server session store (in-memory + MongoDB persistence)
- **Client behavior:** Always call server for state changes; listen to WebSocket for updates
- **No local caching:** Clients re-fetch after mutations or wait for WebSocket broadcast
- **Exception:** UI loading states (optimistic updates OK, but validate server response)

## Authentication & Authorization Rules

| Action | User | Admin |
|--------|------|-------|
| Create room | ✗ | ✓ |
| Start/end session | ✗ | ✓ |
| Join room | ✓ | ✓ |
| Reserve song | ✓ | ✓ |
| Play/pause own song | ✓ | ✓ |
| Play/pause any song | ✗ | ✓ |
| Skip any song | ✗ | ✓ |
| Reorder queue | ✗ | ✓ |
| Edit/delete songs | ✗ | ✓ |
| Disconnect user | ✗ | ✓ |
| Assign players | ✗ | ✓ |

## Database Schema (MongoDB)

```
rooms {
  id, roomNumber (6-digit UNIQUE), passcodeProtected, passcode (hashed),
  qrCode, createdBy, createdAt, sessionStarted, status ("active"|"ended"),
  atmosphere (optional)
}

users {
  id, nickname (UNIQUE globally), password (hashed, nullable),
  role ("admin"|"user"), roomId (nullable), joinedAt, lastActivity, songHistory
}

songs {
  id, title, artist, duration (ms), language, fileUrl, provider,
  providerId, lyrics (optional), tags[], metadata (JSON), createdAt, updatedAt
}

queue_items {
  id, roomId, songId, addedBy, status ("pending"|"playing"|"completed"|"cancelled"),
  addedAt, startedAt (optional), completedAt (optional)
}

songDrafts {
  id, createdBy, roomId, providerId, tempFilePath, metadata (Song),
  status ("pending"|"completed"|"cancelled"), createdAt, expiresAt
}
```

## MediaProvider Abstraction

**Pattern:** All song discovery goes through pluggable providers, not hardcoded YouTube logic.

```ts
interface MediaProvider {
  searchSongs(query: string): Promise<Song[]>;
  getSongMetadata(id: string): Promise<SongMetadata>;
  extractMetadata(url: string): Promise<SongMetadata>;
}
```

- Implementations in `/server/src/media/[provider].ts` (e.g., `youtube.ts`, `spotify.ts`)
- Register in `/server/src/media/registry.ts`
- **Search suggestions algorithm:** If query lacks karaoke keywords ("karaoke", "instrumental", "off vocal"), append " karaoke" before searching
- File storage: Plain filesystem (or S3 abstraction later); use SHA256 content hash to avoid re-downloading

## Admin App Responsive Design

**One codebase, two layouts:**
- **Desktop (≥768px):** Multi-panel grid (player controls, downloads, queue, users visible simultaneously)
- **Mobile (<768px):** Tab-based navigation (one screen at a time)

Use `useResponsive()` hook to detect viewport; conditional rendering handles layout switch.

**Admin App Screens:**
1. **Login** — nickname/password
2. **Rooms Management** — list, create, edit, close rooms
3. **Songs Management** — search, add, edit, delete songs
4. **Room Dashboard** — 4 panels: player controls, downloads progress, queue, participants

## Controller App (Mobile-Only)

**Screens:**
1. **Login** — nickname + room ID
2. **Secondary Auth** (if needed) — password + room passcode
3. **Dashboard** — now playing, user's reservations, "Song Book" button
4. **Song Book** — browse/search database
5. **Suggestion** — search MediaProvider results
6. **Manual URL** — paste direct link
7. **Enhancement** — edit metadata, preview, download/reserve

## Player App (4-Layer Architecture)

1. **Player Layer** — Full-screen video playback; reverts to looped background if queue empty
2. **Scoring Layer** — Full-screen score overlay (pops up after song, blocks interaction)
3. **UI Overlays** (always on top):
   - Top: Queue/reservation list (scrolls right-to-left; first item = now playing with 🎤)
   - Bottom: Admin broadcast messages (scrolling text)
   - Bottom-left: QR code + room ID
4. **Controls** — Play/Pause, Skip, Seek, Volume (appear on interaction, auto-hide, synced via WebSocket)

## Testing & Quality

- **Unit tests:** Jest in `/server/services/__tests__` (mock session/queue state)
- **No integration tests yet** (focus on single-unit logic)
- **Strict TypeScript:** tsconfig.json has `strict: true` in all workspaces; no `any`
- **Error handling:** Server layer validates all input; clients show user-friendly messages
- **Logging:** Use `console.error()` for issues; structured logging (Winston, Pino) optional later

## Common Pitfalls to Avoid

- ❌ **Client-side state caching:** Always fetch from server after mutations
- ❌ **Hardcoded MediaProvider logic:** Use `/media/` abstraction instead
- ❌ **Modifying session state outside `/server/src/services/`:** Centralize all mutations
- ❌ **Unhandled async in React useEffect:** Always clean up subscriptions
- ❌ **Missing WebSocket broadcasts:** If state changes, emit event so all clients sync
- ❌ **Nickname scoping confusion:** Nicknames are globally unique, but still checked per-room
- ❌ **Trusting client input:** Validate roomId, userId, permissions on server before action

## Environment Variables Required

Server needs (in `.env` or `docker-compose.yml`):
- `MONGODB_URI` — MongoDB connection (e.g., `mongodb://mongodb:27017/singalong`)
- `MINIO_ENDPOINT` — MinIO API endpoint (e.g., `http://minio:9000`)
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` — MinIO credentials
- `MEDIA_PROVIDER_API_KEY` — YouTube API key (if using YouTube provider)
- `OPENAI_API_KEY` — For song metadata extraction (optional)
- `NODE_ENV` — `development` or `production`

Clients need (via `EXPO_PUBLIC_*` prefix in docker-compose or `.env`):
- `EXPO_PUBLIC_API_URL` — Server URL (e.g., `http://localhost:3000`)

## Useful Links & References

- **Shared domain models:** `/shared/src/models.ts` — read this first to understand Room, User, Song, Queue
- **API types:** `/server/src/models/api.ts` — request/response shapes for each endpoint
- **Development helper:** `scripts/dev.sh` — helper commands (not yet implemented, but can extend)
- **Architecture docs:** `README.md`, `PROJECT_STRUCTURE.md`, `QUICK_REFERENCE.md` in root

---

## Expanded Reference (For Deep Dives)

### Full Authentication Details
- **Admin:** Always password-protected. Can only join via admin app (or controller app with password).
- **User (no password):** Can join same room from any device without password; first login "claims" the nickname.
- **User (password-protected):** Owns nickname globally; can join different rooms, auto-kicks old session.
- **Nickname collision (same room):** If non-password user tries to join same room with taken nickname, denied until original leaves or goes idle 10+ min.
- **Room passcode:** Optional; applied to all joiners (not per-user).

### Full Queue Logic
- **Empty queue → new song:** Plays immediately
- **Non-empty queue → new song:** Queued at end
- **Duplicate handling:**
  - Already in database → reuse existing entry
  - Already in queue → user prompted to confirm replay
  - Already played in room → user can still reserve (with notification)
- **User controls:** Can only play/pause/skip their own song
- **Admin controls:** Can play/pause/skip/reorder any song
- **Song cancellation:** Users can cancel their own song before it starts

### Full Song Suggestion Flow
1. **User submits URL** → server fetches via MediaProvider (ytdl-core, distube, etc.)
2. **Metadata extraction** → raw title, artist, duration from provider
3. **OpenAI enhancement** (optional) → intelligent inference of title, artist, language, tags
4. **Draft created** → user reviews/edits metadata in app
5. **Finalize** → validate, save to MongoDB, mark draft complete, optionally reserve immediately
6. **Cancel** → delete temporary files, delete draft record
7. **Admin cleanup** → find abandoned drafts (not finalized within X hours), review for deletion

### Full Room Lifecycle with Sessions
1. **Admin creates room** → generates 6-digit roomNumber + QR code
2. **Admin joins** (via admin app) → gains full control
3. **Admin starts session** (optional during creation, or later) → sessionStarted = true
4. **Users join** (via controller) → added to participants list
5. **Player assigned** → displays QR code + room ID for users to scan
6. **Session active** → queue running, playback synced via WebSocket
7. **Admin ends session** → sessionStarted = false, all playback paused
8. **Admin closes room** → status = "ended", connections closed, room no longer joinable
9. **Admin can reopen room** (TBD) — or must create new one

### WebSocket Event Details
All events follow structure:
```ts
{ type: string, roomId: string, payload: {...}, timestamp: number }
```

**Playback:**
- `playback_started` → {songId, currentTime}
- `playback_paused` → {songId, currentTime}
- `playback_resumed` → {songId, currentTime}

**Seeking:**
- `seek_changed` → {songId, seekTime}

**Queue:**
- `queue_updated` → {queue: ReservedSong[]}
- `song_changed` → {songId, title, artist, reservedBy, startTime}

**Users:**
- `user_joined` → {userId, nickname, roomId}
- `user_left` → {userId, roomId}
- `user_disconnected` → {userId, reason}

**Volume:**
- `volume_changed` → {volume: 0-100}
- `mute_toggled` → {isMuted: boolean}

**Messages:**
- `broadcast_message` → {message: string, sender: "admin"}

### Cross-Platform Client Architecture
Each client (Admin, Controller, Player) is independent Expo project:
- Can be deployed/updated separately
- All use `react-native-web` for browser rendering
- Native code (iOS/Android) via Expo modules
- Shared types from `/shared/src/models.ts`
- Shared components from `/ui-library/src/components/`
- App-specific services in `[app]/services/` (API calls, WebSocket subscriptions)

**Key pattern:** No app-specific state in other apps. Server is source of truth.

### Room Atmosphere & Recommendations (Future)
Rooms can have optional `atmosphere` field ("weeb", "traditional", "pop", etc.):
- Used by recommendation engine to suggest relevant songs
- E.g., "weeb" rooms suggest Japanese/anime songs
- Set by admin during room creation or updated later

### MinIO File Storage
Song files stored in MinIO (S3-compatible):
- Bucket: `singalong-songs` (created on startup)
- Key format: `[providerId]/[contentHash].[ext]` (e.g., `youtube-abc123/sha256hash.mp4`)
- Enables content deduplication (same URL never re-downloaded)
- Can migrate to cloud S3 later via S3 API compatibility

### Default Admin Credentials
- Username: `admin`
- Password: `P@ssw0rd!` (configurable via environment)

---

**Last Updated:** December 2025  
**Scaffolding Status:** Core architecture & models defined; routes/services in TODO; client screens in TODO
