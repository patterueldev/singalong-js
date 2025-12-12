# Singalong Karaoke System

A decentralized, cross-platform karaoke system where users host their own servers locally. Built with Node.js, React Native, TypeScript, MongoDB, and MinIO.

## 🎤 System Overview

**Architecture:**
- **Server** — Node.js + Express, runs locally on user's machine
- **Admin App** — React Native + Expo (web, iOS, Android) - responsive, controls room and playback
- **Controller App** — React Native + Expo (mobile-only) - users browse songs and make reservations
- **Player App** — React Native + Expo (web, iOS, Android, tvOS, macOS, Windows) - displays current song

**Key Features:**
- Decentralized: Each user hosts their own server (no cloud required)
- Cross-platform: Web, iOS, Android, tvOS, macOS, Windows support
- Song discovery: Browse local database, search YouTube, add new songs
- Queue management: Real-time song reservations and playback control
- WebSocket sync: All clients stay in sync via real-time events
- Multi-player: Assign multiple player devices to a room

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (optional, for containerized setup)

### Development Setup

```bash
# Install dependencies for all workspaces
npm install

# Start all services with Docker
docker-compose up

# Or start individually:
npm run dev:server          # Start server on http://localhost:3000
npm run dev:admin           # Start admin app on http://localhost:3001
npm run dev:controller      # Start controller app on http://localhost:3002
npm run dev:player          # Start player app on http://localhost:3003
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/singalong

# MinIO (S3-compatible storage)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# APIs
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=...

# Expo
EXPO_USERNAME=your_expo_username
EXPO_PASSWORD=your_expo_password
```

## 📁 Project Structure

```
singalong-js/
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── index.ts          # Express + WebSocket entry point
│   │   ├── routes/           # API endpoint handlers
│   │   ├── services/         # Business logic (session, queue, auth)
│   │   ├── models/           # MongoDB schemas and API types
│   │   ├── media/            # MediaProvider implementations
│   │   └── websocket/        # Real-time event dispatcher
│   └── package.json
│
├── admin-app/                 # Admin dashboard
│   ├── src/
│   │   ├── screens/          # Login, RoomsManagement, SongsManagement, RoomDashboard
│   │   ├── layouts/          # DesktopLayout, MobileLayout (responsive)
│   │   ├── services/         # API calls, WebSocket subscriptions
│   │   └── components/       # Reusable UI components
│   └── app.json              # Expo config
│
├── controller-app/            # User song search & reservation
│   ├── src/
│   │   ├── screens/          # Login, Dashboard, SongBook, Suggestion, Enhancement
│   │   ├── services/         # API calls
│   │   └── components/       # UI components
│   └── app.json
│
├── player-app/                # Full-screen video player
│   ├── src/
│   │   ├── layers/           # PlayerLayer, ScoringLayer, UIOverlays, Controls
│   │   ├── services/         # WebSocket subscriptions
│   │   └── components/       # Video player, queue display, QR code
│   └── app.json
│
├── shared/                    # Shared TypeScript types & utilities
│   ├── src/
│   │   ├── models.ts         # Room, User, Song, ReservedSong, SongDraft interfaces
│   │   ├── utils.ts          # Helper functions (filtering, formatting, etc)
│   │   └── index.ts          # Main exports
│   └── package.json
│
├── ui-library/                # Shared React Native components
│   ├── src/
│   │   ├── components/       # Button, Modal, SearchBar, InputField, etc
│   │   └── index.ts
│   └── package.json
│
├── docker-compose.yml         # Docker services definition
├── .env.example               # Environment variables template
└── package.json               # Monorepo root with npm workspaces
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/admin/login` — Admin login
- `POST /auth/admin/logout` — Admin logout
- `POST /rooms/:roomId/join` — User join room
- `POST /rooms/:roomId/leave` — User leave room

### Rooms
- `POST /rooms` — Create room (admin)
- `GET /rooms/:roomId` — Get room details
- `POST /rooms/:roomId/start-session` — Start session (admin)
- `POST /rooms/:roomId/end-session` — End session (admin)

### Queue & Playback
- `GET /rooms/:roomId/queue` — Get full queue
- `GET /rooms/:roomId/current-song` — Get now playing
- `POST /rooms/:roomId/queue` — Add song to queue
- `DELETE /rooms/:roomId/queue/:queueItemId` — Remove from queue
- `POST /rooms/:roomId/queue/:queueItemId/play` — Play/resume song
- `POST /rooms/:roomId/queue/:queueItemId/pause` — Pause song
- `POST /rooms/:roomId/queue/:queueItemId/skip` — Skip song

### Songs
- `GET /songs/search?q=...` — Search database
- `GET /songs/search-suggestions?q=...` — Search YouTube
- `POST /songs/suggest` — Submit URL for suggestion
- `POST /songs/finalize` — Finalize and save song
- `DELETE /songs/suggest/:draftId` — Cancel suggestion

### Users
- `GET /rooms/:roomId/users` — Get users in room
- `POST /rooms/:roomId/users/:userId/disconnect` — Disconnect user (admin)

## 📡 Real-Time Events (WebSocket)

**Broadcast Events:**
- `playback_started` — Song playback began
- `playback_paused` — Song paused
- `playback_resumed` — Song resumed
- `seek_changed` — User seeked to position
- `queue_updated` — Queue modified
- `song_changed` — Different song now playing
- `volume_changed` — Volume adjusted
- `mute_toggled` — Mute state changed

## 🎯 Room Lifecycle

1. **Admin creates room** — Gets 6-digit room number + QR code
2. **Admin joins room** — Gains full management access
3. **Admin starts session** (optional) — Room becomes available to users
4. **Users/Controllers join** — Enter nickname, optional password, room passcode
5. **Player app joins** — Displays current song and queue
6. **Admin manages playback** — Skip, reorder, edit queue items
7. **Admin ends session & closes room** — All clients disconnect

## 🎵 Song Discovery Flow

1. **Song Book** — Browse database by title, artist, language, tags
2. **Suggest Song** — Search YouTube for songs not in database
3. **Manual URL Entry** — Paste direct link (YouTube, etc)
4. **Enhancement Page** — Edit metadata (title, artist, lyrics) and preview
5. **Download & Reserve** — Add to database and queue immediately

## 🔐 Authentication Model

| Role | Auth Type | Details |
|------|-----------|---------|
| **Admin** | Password-protected | Mandatory password; session-based login/logout |
| **User** | Optional password + room passcode | Can "own" nickname with password; join with room passcode if room requires |
| **Player** | Server-assigned token | Admin provisions during room setup |

**Nickname Rules:**
- Global uniqueness: One nickname per server
- Room exclusivity: One person per nickname per room at a time
- Password protection: Only password-protected nicknames can switch rooms
- Idle timeout: Non-password users auto-disconnect after 10 minutes

## 🛠️ Development

### Build Shared Package
```bash
cd shared
npm run build
```

### Build UI Library
```bash
cd ui-library
npm run build
```

### Run Server Only
```bash
cd server
npm run dev
# Server runs on http://localhost:3000
```

### Run Apps with Expo
```bash
cd admin-app
npm run web      # Web: http://localhost:3001
npm run ios      # iOS simulator
npm run android  # Android emulator
```

### Run Tests
```bash
npm run test      # Run all tests
npm run lint      # Lint all workspaces
```

## 🐳 Docker Services

Services defined in `docker-compose.yml`:

- **server** (port 3000) — Node.js backend
- **admin-app** (port 3001) — Admin dashboard
- **controller-app** (port 3002) — User controller
- **player-app** (port 3003) — Video player
- **mongodb** (port 27017) — Database
- **minio** (ports 9000/9001) — S3-compatible storage
- **cloudflared** — Optional Tunnel for remote access

## 📚 Key Technologies

- **Backend:** Node.js, Express, TypeScript
- **Frontend:** React Native, Expo, React Navigation
- **Database:** MongoDB
- **Storage:** MinIO (S3-compatible)
- **Real-time:** WebSocket (ws)
- **Auth:** bcryptjs, JWT (session tokens)
- **Media:** youtube-dl, @distubejs/ytsr, OpenAI
- **Validation:** Joi

## 📖 Documentation

See `.github/copilot-instructions.md` for comprehensive architecture documentation including:
- Room and session models
- Complete API specifications
- Authentication patterns
- Song infrastructure and discovery
- WebSocket event specifications
- Admin workflow
- Client app UI specifications

## 📝 License

[To be determined]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions or issues, open an issue on GitHub or contact the maintainers.
