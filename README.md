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
- Node.js 18+
- **pnpm 8+** (⚠️ **Required** - install: `npm install -g pnpm`)
- Docker and Docker Compose

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd singalong-js

# 2. Install dependencies (always use pnpm!)
pnpm install
```

## 🏃 Running the Application

### Option 1: Development with Docker (Recommended)

Start all services in Docker containers:

```bash
# Start everything (server, MongoDB, MinIO, all client apps)
docker-compose up

# Or start in background
docker-compose up -d

# View logs
docker-compose logs -f server

# Stop all services
docker-compose down
```

**Access points:**
- Server API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs
- Admin App: http://localhost:3001
- Controller App: http://localhost:3002
- Player App: http://localhost:3003
- MongoDB: localhost:27017
- MinIO Console: http://localhost:9001
- Mongo Express: http://localhost:8082

### Option 2: Local Development (Server only)

Run the server locally while using Docker for database/storage:

```bash
# 1. Start infrastructure only
docker-compose up mongodb minio -d

# 2. Start server locally
pnpm --filter server run dev

# Server will run at http://localhost:3000
```

**Benefits of local development:**
- Faster reload on code changes
- Easier debugging with breakpoints
- Direct access to TypeScript source

### Option 3: Run Specific Services

```bash
# Start only what you need
docker-compose up mongodb minio -d              # Just infrastructure
docker-compose up server -d                     # Add server
docker-compose up admin-app -d                  # Add admin app

# Or run client apps locally
pnpm --filter admin-app run start
pnpm --filter controller-app run start
pnpm --filter player-app run start
```

## 🧪 Testing

### Automated Test Suite

Run complete tests with fresh data (recommended before commits):

```bash
./scripts/run-tests.sh
```

**What it does:**
1. Stops all Docker containers
2. Removes old test data (fresh start)
3. Installs dependencies
4. Builds TypeScript
5. Starts test infrastructure (MongoDB on port 27018, MinIO on 9002-9003)
6. Starts test server
7. Runs unit tests
8. Tests all API endpoints (health, auth, rooms, queue)
9. Checks performance
10. Cleans up everything

**Duration:** ~1-2 minutes

### Quick API Test

If server is already running:

```bash
./scripts/test-runtime.sh
```

Tests health, login, API docs in ~5 seconds.

### Development Testing

```bash
# Unit tests only
pnpm --filter server run test

# Watch mode (auto-rerun on changes)
pnpm --filter server run test:watch

# Integration tests
pnpm --filter server run test:integration
```

See [TESTING.md](TESTING.md) for complete testing guide.

## 🔧 Environment Configuration

Three environments with isolated data:

| Environment | Database Port | MinIO Ports | Use Case |
|-------------|---------------|-------------|----------|
| **Development** | 27017 | 9000-9001 | Active coding |
| **Test** | 27018 | 9002-9003 | Automated tests |
| **Production** | 27017 | 9000-9001 | Deployment |

### Quick Environment Setup

Development is pre-configured and ready to use:

```bash
# Development (default)
docker-compose up -d

# Test (used by test script)
docker-compose -f docker-compose.test.yml up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

**Environment files:**
- `.env.development` - Ready to use
- `.env.test` - Used by test script
- `.env.production` - ⚠️ Update passwords before deploying!

See [ENVIRONMENTS.md](ENVIRONMENTS.md) for detailed configuration.

## 🐳 Docker Management

### View Running Containers

```bash
# All singalong containers
docker ps | grep singalong

# Specific environment
docker ps | grep singalong-dev
docker ps | grep singalong-test
```

### Stop/Remove Containers

```bash
# Stop development
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Stop test environment
docker-compose -f docker-compose.test.yml down -v
```

### View Logs

```bash
# Follow server logs
docker-compose logs -f server

# All logs
docker-compose logs -f

# Specific container
docker logs singalong-dev-mongodb
```

### Clean Up Everything

```bash
# Remove all singalong containers and volumes
docker stop $(docker ps -a | grep singalong | awk '{print $1}')
docker rm $(docker ps -a | grep singalong | awk '{print $1}')
docker volume rm $(docker volume ls | grep singalong | awk '{print $2}')
```

See [DOCKER.md](DOCKER.md) for complete Docker guide.

## 📦 Package Manager

⚠️ **CRITICAL: Always use `pnpm`, never `npm` or `yarn`**

This is a monorepo managed with pnpm workspaces:

```bash
# ✅ Correct
pnpm install
pnpm --filter server run dev
pnpm run build --workspaces

# ❌ Wrong - Don't use these!
npm install
yarn install
npm run dev
```

## 🛠️ Development Workflow

### Daily Development

```bash
# 1. Start infrastructure
docker-compose up mongodb minio -d

# 2. Start server with hot reload
pnpm --filter server run dev

# 3. Make changes to code...

# 4. Test your changes
./scripts/test-runtime.sh

# 5. Before committing
./scripts/run-tests.sh
git add .
git commit -m "Your changes"
```

### Building for Production

```bash
# Build all workspaces
pnpm run build --workspaces

# Or build specific workspace
pnpm --filter server run build
pnpm --filter admin-app run build
```

### Troubleshooting

**Port already in use:**
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>

# Or stop Docker containers
docker-compose down
```

**Database connection issues:**
```bash
# Check MongoDB is running
docker ps | grep mongodb

# Restart MongoDB
docker-compose restart mongodb
```

**Clean slate (nuclear option):**
```bash
# Remove everything and start fresh
docker-compose down -v
pnpm install
docker-compose up -d
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
pnpm run test      # Run all tests
pnpm run lint      # Lint all workspaces
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
