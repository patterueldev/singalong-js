# Setup Guide - Singalong Karaoke System

This guide walks you through setting up and running the Singalong karaoke system locally.

## Prerequisites

- **Node.js 18+** — Download from https://nodejs.org/
- **npm** — Comes with Node.js
- **Docker & Docker Compose** (optional, recommended) — Download from https://www.docker.com/
- **Git** — For version control

## Installation Steps

### 1. Clone and Navigate to Project

```bash
cd /Users/pat/Projects/PERSONAL/singalong-js
```

### 2. Install All Dependencies

```bash
npm install
```

This installs dependencies for:
- Root monorepo
- Server workspace
- Shared types workspace
- UI library workspace
- All client app workspaces

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/singalong

# MinIO (S3-compatible storage)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# OpenAI (for song metadata extraction)
OPENAI_API_KEY=sk-your-key-here

# YouTube API (for song search)
YOUTUBE_API_KEY=your-key-here

# Expo (optional, for building mobile apps)
EXPO_USERNAME=your-username
EXPO_PASSWORD=your-password
```

## Running the System

### Option 1: Docker Compose (Recommended)

All services in one command:

```bash
docker-compose up
```

This starts:
- **Server** on http://localhost:3000
- **Admin App** on http://localhost:3001
- **Controller App** on http://localhost:3002
- **Player App** on http://localhost:3003
- **MongoDB** on localhost:27017
- **MinIO Console** on http://localhost:9001 (admin/admin)

To stop:

```bash
docker-compose down
```

To rebuild after code changes:

```bash
docker-compose up --build
```

### Option 2: Local Development (Manual)

Requires MongoDB and MinIO running locally (see below).

#### Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or if installed locally
mongod
```

#### Start MinIO

```bash
# Using Docker
docker run -d -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio:latest server /data --console-address ":9001"

# MinIO Console: http://localhost:9001 (admin/admin)
```

#### Start Server

```bash
cd server
npm run dev
```

Server runs on http://localhost:3000

#### Start Admin App

In a new terminal:

```bash
cd admin-app
npm run web
```

Runs on http://localhost:3001

#### Start Controller App

In a new terminal:

```bash
cd controller-app
npm run web
```

Runs on http://localhost:3002

#### Start Player App

In a new terminal:

```bash
cd player-app
npm run web
```

Runs on http://localhost:3003

## Testing the System

### 1. Access Admin App

Open http://localhost:3001 in your browser

**Default credentials:**
- Username: `admin`
- Password: `P@ssw0rd!` (or see .env)

### 2. Create a Room

Click "Create Room" → optionally set passcode → get 6-digit room number

### 3. Access Controller App

Open http://localhost:3002

- Enter nickname: `user1`
- Enter room number (from step 2)
- Join room

### 4. Access Player App

Open http://localhost:3003

- Player will display once admin starts session
- Queue displays upcoming songs

### 5. Add Songs

In Controller App:
- Click "Song Book" → search for songs
- Or "Suggest Song" to search YouTube
- Click "Download & Reserve" to add to queue

## Troubleshooting

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

### Port Already in Use

If ports 3000-3003, 27017, or 9000 are already in use:

**Option 1:** Stop other processes using those ports

**Option 2:** Change ports in docker-compose.yml or .env

### MongoDB Connection Error

Check if MongoDB is running:

```bash
# Docker
docker ps | grep mongo

# Local
lsof -i :27017
```

### WebSocket Connection Failed

Ensure server is running and accessible:

```bash
curl http://localhost:3000/health
```

Should return: `{"status":"ok","timestamp":...}`

### App Not Loading

1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for errors (F12)
4. Check server logs for errors

## Building for Production

### Web Apps

```bash
cd admin-app
npm run build:web
# Output: dist/ folder with static files

cd controller-app
npm run build:web

cd player-app
npm run build:web
```

### Mobile Apps (iOS/Android)

```bash
cd admin-app
npm run eject  # Converts Expo to native project

# Then follow platform-specific build instructions
```

## Project Commands

### Root Level

```bash
npm install          # Install all dependencies
npm run dev:*        # Development servers
npm run build:*      # Build all workspaces
npm run test         # Run tests (requires jest setup)
npm run lint         # Lint all workspaces
```

### Server

```bash
cd server
npm run dev          # Start with ts-node
npm run build        # Compile TypeScript
npm start            # Run compiled JavaScript
npm test             # Run tests
npm run lint         # Lint code
```

### Client Apps

```bash
cd admin-app
npm start            # Start Expo dev server
npm run web          # Web only
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run build:web    # Build for web
npm run lint
```

## Monitoring

### Server Logs

```bash
# Check server console output
tail -f server-logs.txt
```

### MongoDB

```bash
# Connect to MongoDB
mongo
> use singalong
> db.rooms.find()
> db.users.find()
```

### MinIO

- Console: http://localhost:9001
- Access Key: `minioadmin`
- Secret Key: `minioadmin`

## Next Steps

1. **Customize:** Edit colors, branding in `ui-library/src/`
2. **Add Features:** Follow patterns in server routes
3. **Deploy:** Use Docker image for remote hosting
4. **Scale:** Add clustering for multiple rooms

## Documentation

See `.github/copilot-instructions.md` for comprehensive architecture details.

## Support

For issues:
1. Check troubleshooting section above
2. Review `.github/copilot-instructions.md`
3. Check server console for errors
4. Verify all services are running
