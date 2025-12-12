# Project Structure Summary

## Overview

This is a decentralized karaoke system monorepo with 6 workspaces:
- **1 Server** (Node.js backend)
- **3 Client Apps** (React Native + Expo)
- **1 Shared Types Package** (TypeScript interfaces)
- **1 UI Library Package** (React Native components)

## Directory Layout

```
singalong-js/
│
├── 📄 Configuration Files
│   ├── package.json                    # Root monorepo config with workspaces
│   ├── tsconfig.json                   # Root TypeScript config (extended by workspaces)
│   ├── docker-compose.yml              # Docker services definition (7 services)
│   ├── .env.example                    # Environment variables template
│   ├── .gitignore                      # Git ignore patterns
│   └── .github/
│       └── copilot-instructions.md     # AI agent guidance (819 lines)
│
├── 📚 Documentation
│   ├── README.md                       # Main project README
│   ├── SETUP.md                        # Setup and installation guide
│   └── PROJECT_STRUCTURE.md            # This file
│
├── 🛠️ Scripts
│   └── scripts/
│       └── dev.sh                      # Development helper script
│
├── 🖥️ Server
│   ├── server/
│   │   ├── package.json                # Server dependencies (Express, MongoDB, MinIO, etc)
│   │   ├── tsconfig.json               # Server TypeScript config
│   │   └── src/
│   │       ├── index.ts                # Express + WebSocket server entry point
│   │       ├── models/
│   │       │   └── api.ts              # API request/response types
│   │       ├── routes/                 # API endpoint handlers (TBD)
│   │       │   ├── auth.ts
│   │       │   ├── rooms.ts
│   │       │   ├── queue.ts
│   │       │   ├── songs.ts
│   │       │   └── users.ts
│   │       ├── services/               # Business logic (TBD)
│   │       │   ├── auth.ts
│   │       │   ├── room-manager.ts
│   │       │   ├── session-manager.ts
│   │       │   ├── queue-manager.ts
│   │       │   └── storage.ts
│   │       ├── media/                  # MediaProvider implementations (TBD)
│   │       │   ├── youtube.ts
│   │       │   └── registry.ts
│   │       └── websocket/              # Real-time events (TBD)
│   │           └── dispatcher.ts
│   └── dist/                           # Compiled output
│
├── 📱 Admin App
│   ├── admin-app/
│   │   ├── package.json                # Admin app dependencies (Expo, React Navigation, etc)
│   │   ├── tsconfig.json               # TypeScript config
│   │   ├── app.json                    # Expo configuration
│   │   ├── index.js                    # App entry point
│   │   └── src/                        # (TBD)
│   │       ├── screens/                # Screen components
│   │       │   ├── LoginScreen.tsx
│   │       │   ├── RoomsManagementScreen.tsx
│   │       │   ├── SongsManagementScreen.tsx
│   │       │   └── RoomDashboardScreen.tsx
│   │       ├── layouts/                # Responsive layouts
│   │       │   ├── DesktopLayout.tsx   # Multi-panel (≥768px)
│   │       │   ├── MobileLayout.tsx    # Tabs (<768px)
│   │       │   └── RootLayout.tsx      # Detects screen size
│   │       ├── hooks/
│   │       │   └── useResponsive.ts    # Hook for responsive detection
│   │       ├── services/               # API and WebSocket calls
│   │       │   └── api.ts
│   │       └── components/             # Reusable UI components
│   └── dist/                           # Build output
│
├── 📱 Controller App (User)
│   ├── controller-app/
│   │   ├── package.json                # Controller app dependencies
│   │   ├── tsconfig.json               # TypeScript config
│   │   ├── app.json                    # Expo configuration
│   │   ├── index.js                    # App entry point
│   │   └── src/                        # (TBD)
│   │       ├── screens/                # Screen components
│   │       │   ├── LoginScreen.tsx
│   │       │   ├── SecondaryAuthScreen.tsx
│   │       │   ├── DashboardScreen.tsx
│   │       │   ├── SongBookScreen.tsx
│   │       │   ├── SuggestionScreen.tsx
│   │       │   ├── ManualURLScreen.tsx
│   │       │   └── EnhancementScreen.tsx
│   │       ├── services/               # API calls
│   │       │   └── api.ts
│   │       └── components/             # Reusable UI components
│   └── dist/                           # Build output
│
├── 📱 Player App
│   ├── player-app/
│   │   ├── package.json                # Player app dependencies (expo-video, etc)
│   │   ├── tsconfig.json               # TypeScript config
│   │   ├── app.json                    # Expo configuration
│   │   ├── index.js                    # App entry point
│   │   └── src/                        # (TBD)
│   │       ├── layers/                 # 4-layer architecture
│   │       │   ├── PlayerLayer.tsx     # Full-screen video player
│   │       │   ├── ScoringLayer.tsx    # Full-screen overlay (score modal)
│   │       │   ├── UIOverlays.tsx      # Queue, PSA, QR code displays
│   │       │   └── ControlsOverlay.tsx # Play/pause/seek/volume
│   │       ├── services/               # WebSocket subscriptions
│   │       │   └── websocket.ts
│   │       └── components/             # Specialized UI components
│   │           ├── VideoPlayer.tsx
│   │           ├── QueueDisplay.tsx
│   │           └── QRCodeDisplay.tsx
│   └── dist/                           # Build output
│
├── 📦 Shared Package
│   ├── shared/
│   │   ├── package.json                # Shared package config (no framework deps)
│   │   ├── tsconfig.json               # TypeScript config
│   │   └── src/
│   │       ├── models.ts               # Domain interfaces
│   │       │                           # - Room, User, Song, ReservedSong
│   │       │                           # - SongDraft, Session, WebSocketEvent
│   │       ├── utils.ts                # Utility functions
│   │       │                           # - generateRoomNumber(), formatDuration()
│   │       │                           # - isUserIdle(), filterSongs(), etc
│   │       └── index.ts                # Main exports
│   └── dist/                           # Compiled output
│
└── 📦 UI Library Package
    ├── ui-library/
    │   ├── package.json                # UI library config (React Native only)
    │   ├── tsconfig.json               # TypeScript config
    │   └── src/
    │       ├── components/
    │       │   ├── Button.tsx           # Customizable button component
    │       │   ├── Modal.tsx            # Modal dialog (TBD)
    │       │   ├── SearchBar.tsx        # Search input (TBD)
    │       │   ├── InputField.tsx       # Text input (TBD)
    │       │   └── index.ts             # Component exports
    │       └── index.ts                 # Main exports
    └── dist/                           # Compiled output
```

## Workspace Dependencies

```
admin-app ──┐
            ├─> shared
            └─> ui-library
            
controller-app ──┐
                 ├─> shared
                 └─> ui-library
                 
player-app ──┐
             ├─> shared
             └─> ui-library

server ──> shared

ui-library ──> (no dependencies)

shared ──> (no dependencies)
```

## File Types by Workspace

| Workspace | Language | Framework | Output |
|-----------|----------|-----------|--------|
| **server** | TypeScript | Express + Node.js | CommonJS |
| **admin-app** | TypeScript + JSX | React Native + Expo | React Native |
| **controller-app** | TypeScript + JSX | React Native + Expo | React Native |
| **player-app** | TypeScript + JSX | React Native + Expo | React Native |
| **shared** | TypeScript | None | CommonJS |
| **ui-library** | TypeScript + JSX | React Native | React Native |

## Key Technologies

### Server (Backend)
- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **Database:** MongoDB
- **Storage:** MinIO (S3-compatible)
- **Real-time:** WebSocket (ws)
- **Auth:** bcryptjs, JWT
- **Media:** youtube-dl, @distubejs/ytsr, OpenAI

### Client Apps (Frontend)
- **Framework:** React Native + Expo
- **Language:** TypeScript + JSX
- **Navigation:** React Navigation
- **Cross-platform:** Web, iOS, Android, tvOS, macOS, Windows (via react-native-web)

### Shared
- **Language:** TypeScript
- **Contains:** Interfaces and utility functions (no runtime dependencies)

### UI Library
- **Language:** TypeScript + JSX
- **Framework:** React Native
- **Contains:** Reusable components

## Configuration Files

### Root Level
- **package.json** — Defines npm workspaces, shared scripts
- **tsconfig.json** — Base TypeScript config (all workspaces extend this)
- **docker-compose.yml** — Docker services (server, 3 apps, MongoDB, MinIO, CloudFlare Tunnel)
- **.env.example** — Environment variables template

### Per Workspace
- **package.json** — Workspace-specific dependencies
- **tsconfig.json** — Workspace-specific TypeScript config (extends root)
- **app.json** — Expo configuration (mobile apps only)

## Build & Output

### Shared & Server
```
src/ → TypeScript → tsc → dist/ → CommonJS
```

### Client Apps
```
src/ → TypeScript + JSX → Expo → dist/ (or served directly in dev)
```

### UI Library
```
src/ → TypeScript + JSX → tsc → dist/ → React Native Components
```

## Development Workflow

1. **Modify shared types** → `npm run build:shared` → clients import new types
2. **Modify UI components** → `npm run build:ui` → clients use new components
3. **Modify server** → `npm run dev:server` → hot-reload (ts-node)
4. **Modify client apps** → `npm run dev:admin` (Expo hot-reload)

## NPM Workspaces

All commands from root run in all workspaces:

```bash
npm install              # Install all
npm run build:all        # Build all workspaces (TBD)
npm run lint             # Lint all
npm test                 # Test all
```

To run commands in a specific workspace:

```bash
cd server && npm run dev
cd admin-app && npm run web
```

## Docker Services

Services defined in `docker-compose.yml`:

1. **server** (port 3000) — Node.js backend
2. **admin-app** (port 3001) — Admin dashboard (Expo)
3. **controller-app** (port 3002) — User app (Expo)
4. **player-app** (port 3003) — Video player (Expo)
5. **mongodb** (port 27017) — Database
6. **minio** (port 9000/9001) — S3-compatible storage
7. **cloudflared** (optional) — Tunnel for remote access

## Git Structure

```
.git/                      # Git repository
.gitignore                 # Ignore patterns (node_modules, dist, .env, etc)
```

All workspaces share one git repository (monorepo style).

## Next Steps After Setup

1. **Run `npm install`** — Install all dependencies
2. **Configure `.env`** — Set MongoDB URI, MinIO credentials, API keys
3. **Run `docker-compose up`** — Start all services
4. **Access apps:**
   - Admin: http://localhost:3001
   - Controller: http://localhost:3002
   - Player: http://localhost:3003
   - Server API: http://localhost:3000

## Implementation Roadmap

### Phase 1: Foundation ✅ (Scaffolding Complete)
- [x] Monorepo structure
- [x] Shared types package
- [x] UI library with base components
- [x] Server skeleton with Express + WebSocket
- [x] App entry points
- [x] Docker setup

### Phase 2: Server Core (Next)
- [ ] MongoDB models and queries
- [ ] Authentication routes and services
- [ ] Room management
- [ ] Queue management
- [ ] Session manager

### Phase 3: Media & Storage
- [ ] MinIO integration
- [ ] MediaProvider implementations (YouTube)
- [ ] Song suggestion flow
- [ ] File download and caching

### Phase 4: Client Apps
- [ ] Admin app screens and navigation
- [ ] Controller app screens
- [ ] Player app video layer and overlays
- [ ] WebSocket subscriptions

### Phase 5: Real-time & Polish
- [ ] WebSocket event broadcasting
- [ ] Full sync across all clients
- [ ] Error handling and validation
- [ ] Testing and optimization

---

For detailed architecture information, see `.github/copilot-instructions.md`
