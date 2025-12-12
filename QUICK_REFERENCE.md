# Quick Reference Guide

## Quick Start (Copy & Paste)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Start everything with Docker
docker-compose up

# Apps now available:
# - Admin: http://localhost:3001
# - Controller: http://localhost:3002
# - Player: http://localhost:3003
# - Server API: http://localhost:3000
```

## Project Structure at a Glance

```
singalong-js/                  # Monorepo root
├── server/                    # Node.js backend (port 3000)
├── admin-app/                 # Admin dashboard (port 3001)
├── controller-app/            # User app (port 3002)
├── player-app/                # Video player (port 3003)
├── shared/                    # TypeScript types & utilities
├── ui-library/                # React Native components
├── docker-compose.yml         # All services in one file
├── SETUP.md                   # Detailed setup instructions
├── PROJECT_STRUCTURE.md       # Full directory layout
└── README.md                  # Main project README
```

## Common Commands

### Development

```bash
# Start all services (Docker recommended)
docker-compose up

# Start individual services locally
cd server && npm run dev       # Server on :3000
cd admin-app && npm run web    # Admin on :3001
cd controller-app && npm run web    # Controller on :3002
cd player-app && npm run web   # Player on :3003

# Build all workspaces
npm run build:all

# Lint all code
npm run lint
```

### Server Only

```bash
cd server
npm run dev      # Start with hot-reload
npm run build    # Compile TypeScript
npm start        # Run compiled JS
```

### Admin App

```bash
cd admin-app
npm run web      # Web development
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run build:web # Production web build
```

### Controller App

```bash
cd controller-app
npm run web      # Web development
npm run build:web # Production build
```

### Player App

```bash
cd player-app
npm run web      # Web development
npm run build:web # Production build
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
MONGODB_URI=mongodb://localhost:27017/singalong
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=...
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Users' Machines                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  Admin   │  │Controller│  │  Player  │         │
│  │   App    │  │   App    │  │   App    │         │
│  │(Web/iOS) │  │(Mobile)  │  │(Web/TV)  │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │             │             │                │
│       └─────────────┴─────────────┘                │
│               │                                    │
│       WebSocket + REST HTTP                       │
│               │                                    │
│  ┌────────────▼────────────┐                      │
│  │   Singalong Server      │                      │
│  │  (Node.js + Express)    │                      │
│  │     (port 3000)         │                      │
│  └────────────┬────────────┘                      │
│       │       │                                    │
│   MongoDB   MinIO                                  │
│   (DB)      (S3)                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## API Endpoints Quick List

### Auth
- `POST /auth/admin/login` — Admin login
- `POST /auth/admin/logout` — Admin logout

### Rooms
- `POST /rooms` — Create room
- `GET /rooms/:roomId` — Get room
- `POST /rooms/:roomId/join` — User join
- `POST /rooms/:roomId/leave` — User leave
- `POST /rooms/:roomId/start-session` — Start session (admin)

### Queue
- `GET /rooms/:roomId/queue` — Get full queue
- `GET /rooms/:roomId/current-song` — Get now playing
- `POST /rooms/:roomId/queue` — Add song
- `DELETE /rooms/:roomId/queue/:id` — Remove song
- `POST /rooms/:roomId/queue/:id/play` — Play/resume
- `POST /rooms/:roomId/queue/:id/skip` — Skip

### Songs
- `GET /songs/search?q=...` — Search DB
- `GET /songs/search-suggestions?q=...` — Search YouTube
- `POST /songs/suggest` — Suggest new song
- `POST /songs/finalize` — Finalize and save

## WebSocket Events

Real-time updates (automatically broadcast):

- `playback_started` — Song started
- `playback_paused` — Song paused
- `queue_updated` — Queue changed
- `song_changed` — Different song playing
- `volume_changed` — Volume adjusted
- `user_joined` — User connected
- `user_left` — User disconnected

## Default Admin Credentials

```
Username: admin
Password: P@ssw0rd!
```

(Change in .env if needed)

## Troubleshooting

### "Port already in use"
```bash
# Find process using port
lsof -i :3000  # Server
lsof -i :3001  # Admin
lsof -i :3002  # Controller
lsof -i :3003  # Player

# Kill it
kill -9 <PID>
```

### "MongoDB connection error"
```bash
# Check if MongoDB is running
mongo
# If not, start it:
docker run -d -p 27017:27017 mongo:latest
```

### "App not loading"
1. Clear cache: `Ctrl+Shift+Del`
2. Hard refresh: `Ctrl+Shift+R`
3. Check console: `F12`
4. Check server health: `curl http://localhost:3000/health`

## Key File Locations

```
.github/
  └── copilot-instructions.md    # Full architecture docs (819 lines)

server/src/
  ├── index.ts                   # Server entry point
  ├── models/api.ts              # API types
  ├── routes/                    # Endpoints (TBD)
  ├── services/                  # Business logic (TBD)
  └── websocket/                 # Real-time (TBD)

shared/src/
  ├── models.ts                  # Domain interfaces
  ├── utils.ts                   # Helper functions
  └── index.ts                   # Exports

ui-library/src/
  ├── components/
  │   └── Button.tsx             # Base component
  └── index.ts                   # Exports

admin-app/src/                   # (TBD)
controller-app/src/             # (TBD)
player-app/src/                 # (TBD)
```

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Express + TypeScript |
| **Frontend** | React Native + Expo + TypeScript |
| **Database** | MongoDB |
| **Storage** | MinIO (S3-compatible) |
| **Real-time** | WebSocket (ws) |
| **Auth** | bcryptjs, JWT |
| **Media** | youtube-dl, @distubejs/ytsr, OpenAI |

## Next Steps After Setup

1. ✅ **Project scaffolding complete** (you are here)
2. 🚀 **Start with Docker**: `docker-compose up`
3. 📝 **Implement server routes** (auth, rooms, queue, songs)
4. 💾 **Setup MongoDB models** (rooms, users, songs)
5. 🎨 **Build client screens** (screens, navigation, services)
6. 🔌 **Implement WebSocket sync** (real-time events)

## Documentation Files

```
README.md              # Main overview and quick start
SETUP.md               # Detailed setup instructions
PROJECT_STRUCTURE.md   # Full directory layout and dependencies
QUICK_REFERENCE.md     # This file
.github/copilot-instructions.md # Comprehensive architecture (819 lines)
```

## Getting Help

1. Check `SETUP.md` for setup issues
2. Check `PROJECT_STRUCTURE.md` for navigation
3. Check `.github/copilot-instructions.md` for architecture
4. Check server console for errors
5. Check browser console (F12) for client errors

## One-Liner Commands

```bash
# Full reset
rm -rf node_modules package-lock.json .env && npm install && cp .env.example .env

# Start everything
docker-compose up

# Stop everything
docker-compose down

# View logs
docker-compose logs -f server

# Check health
curl http://localhost:3000/health
```

---

**Status:** ✅ Project scaffolding complete. Ready for implementation.

See `.github/copilot-instructions.md` for comprehensive documentation.
