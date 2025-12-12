# Developer Checklist - Singalong Karaoke System

Use this checklist to track implementation progress and ensure nothing is missed.

## ✅ Pre-Flight (Completed)

- [x] Project scaffolding complete
- [x] Root monorepo configured (npm workspaces)
- [x] 6 workspaces created and configured
- [x] TypeScript setup across all packages
- [x] Docker services defined
- [x] Documentation written
- [x] Development scripts created

## 📦 Phase 1: Foundation (In Progress)

### Workspaces
- [x] Server workspace (`server/`)
- [x] Admin app workspace (`admin-app/`)
- [x] Controller app workspace (`controller-app/`)
- [x] Player app workspace (`player-app/`)
- [x] Shared types package (`shared/`)
- [x] UI library package (`ui-library/`)

### Dependencies
- [x] Server dependencies listed
- [x] Client dependencies listed
- [x] Shared package dependencies listed
- [x] UI library dependencies listed

### Configuration
- [x] Root `package.json` with workspaces
- [x] Root `tsconfig.json`
- [x] Server `tsconfig.json`
- [x] App `tsconfig.json` files
- [x] Shared `tsconfig.json`
- [x] UI library `tsconfig.json`
- [x] Docker Compose configuration
- [x] `.env.example` template
- [x] `.gitignore`

### Documentation
- [x] README.md
- [x] SETUP.md
- [x] PROJECT_STRUCTURE.md
- [x] QUICK_REFERENCE.md
- [x] .github/copilot-instructions.md (819 lines)
- [x] SCAFFOLDING_COMPLETE.md
- [x] This checklist

## 🔧 Phase 2: Server Core (Next)

### MongoDB Models & Queries
- [ ] Room model and schema
- [ ] User model and schema
- [ ] Song model and schema
- [ ] ReservedSong/Queue model
- [ ] SongDraft model
- [ ] Session model
- [ ] Database initialization script

### Authentication Service
- [ ] Implement password hashing (bcryptjs)
- [ ] Implement session token generation
- [ ] Implement JWT token signing/verification
- [ ] Implement admin login endpoint
- [ ] Implement admin logout endpoint
- [ ] Implement user join endpoint
- [ ] Implement user leave endpoint
- [ ] Implement password protection logic

### Authentication Routes
- [ ] POST `/auth/admin/login`
- [ ] POST `/auth/admin/logout`
- [ ] POST `/rooms/:roomId/join`
- [ ] POST `/rooms/:roomId/leave`
- [ ] Middleware for auth validation

### Room Management Service
- [ ] Generate 6-digit room numbers
- [ ] Create room logic
- [ ] Start session logic
- [ ] End session logic
- [ ] Close room logic
- [ ] Passcode handling (hashing/verification)

### Room Management Routes
- [ ] POST `/rooms` — Create room
- [ ] GET `/rooms/:roomId` — Get room details
- [ ] PATCH `/rooms/:roomId` — Update room
- [ ] GET `/rooms` — List all rooms (admin)
- [ ] POST `/rooms/:roomId/start-session`
- [ ] POST `/rooms/:roomId/end-session`

### Queue Management Service
- [ ] Add song to queue logic
- [ ] Remove song from queue logic
- [ ] Reorder queue logic
- [ ] Get queue logic
- [ ] Get current song logic
- [ ] Play song logic (timing, status)
- [ ] Pause song logic
- [ ] Resume song logic
- [ ] Skip song logic
- [ ] Queue advancement logic

### Queue Management Routes
- [ ] GET `/rooms/:roomId/queue`
- [ ] GET `/rooms/:roomId/current-song`
- [ ] POST `/rooms/:roomId/queue` — Add song
- [ ] PATCH `/rooms/:roomId/queue/:id` — Update queue item
- [ ] DELETE `/rooms/:roomId/queue/:id` — Remove from queue
- [ ] POST `/rooms/:roomId/queue/:id/play`
- [ ] POST `/rooms/:roomId/queue/:id/pause`
- [ ] POST `/rooms/:roomId/queue/:id/resume`
- [ ] POST `/rooms/:roomId/queue/:id/skip`

### User Management Service
- [ ] User join room logic
- [ ] User leave room logic
- [ ] Idle detection and auto-disconnect
- [ ] Nickname uniqueness validation
- [ ] Password protection logic
- [ ] Passcode verification

### User Management Routes
- [ ] GET `/rooms/:roomId/users` — List users
- [ ] POST `/rooms/:roomId/users/:userId/disconnect`
- [ ] PATCH `/users/:userId` — Update user profile
- [ ] PATCH `/users/:userId/password` — Set password

## 🎵 Phase 3: Song Infrastructure

### MediaProvider Interface
- [ ] Define MediaProvider interface
- [ ] Create MediaProvider registry
- [ ] Implement YouTube provider
- [ ] Implement fallback providers

### Song Search
- [ ] GET `/songs/search?q=...` — Search database
- [ ] GET `/songs/search-suggestions?q=...` — Search YouTube
- [ ] Add "karaoke" keyword logic to searches
- [ ] Cache search results

### Song Suggestion Flow
- [ ] POST `/songs/suggest` — Accept URL and extract metadata
- [ ] Store temporary draft file
- [ ] Create SongDraft record
- [ ] POST `/songs/finalize` — Finalize and save to database
- [ ] DELETE `/songs/suggest/:draftId` — Cancel suggestion
- [ ] GET `/admin/drafts` — List abandoned drafts
- [ ] Background job to cleanup expired drafts

### Song Database Routes
- [ ] GET `/songs/search?q=...`
- [ ] GET `/songs/search-suggestions?q=...`
- [ ] POST `/songs/suggest`
- [ ] POST `/songs/finalize`
- [ ] DELETE `/songs/suggest/:draftId`
- [ ] GET `/admin/drafts`
- [ ] PATCH `/songs/:songId` — Edit (admin)
- [ ] DELETE `/songs/:songId` — Delete (admin)

## 💾 Phase 4: File Storage

### MinIO Integration
- [ ] Setup MinIO connection
- [ ] Create bucket for songs
- [ ] Create bucket for temp files
- [ ] Implement upload logic
- [ ] Implement download logic
- [ ] Implement delete logic
- [ ] Implement content-hash deduplication
- [ ] Error handling for storage operations

### File Management
- [ ] Download YouTube media with youtube-dl
- [ ] Extract metadata from media
- [ ] Save to MinIO with content hash
- [ ] Generate presigned URLs
- [ ] Cleanup temp files
- [ ] Handle failed uploads

## 📡 Phase 5: WebSocket Real-Time

### WebSocket Connection
- [ ] Setup WebSocket server
- [ ] Implement connection handler
- [ ] Implement authentication for WebSocket
- [ ] Implement disconnection handler
- [ ] Implement error handler
- [ ] Keep-alive/heartbeat logic

### Event Broadcasting
- [ ] Broadcast playback_started
- [ ] Broadcast playback_paused
- [ ] Broadcast playback_resumed
- [ ] Broadcast seek_changed
- [ ] Broadcast queue_updated
- [ ] Broadcast song_changed
- [ ] Broadcast volume_changed
- [ ] Broadcast mute_toggled
- [ ] Broadcast user_joined
- [ ] Broadcast user_left
- [ ] Room-scoped broadcasting (only send to users in room)

### Event Dispatcher
- [ ] Central event dispatcher service
- [ ] Subscribe/unsubscribe logic
- [ ] Event type routing
- [ ] Payload validation
- [ ] Error handling
- [ ] Logging

## 🎨 Phase 6: Admin App

### Screens
- [ ] LoginScreen with credential input
- [ ] RoomsManagementScreen (create, list, edit)
- [ ] SongsManagementScreen (browse, edit, delete)
- [ ] RoomDashboardScreen with 4 panels:
  - [ ] Player Controls Panel (top-left)
  - [ ] Downloads Panel (bottom-left)
  - [ ] Reservation List Panel (top-right)
  - [ ] Participants List Panel (bottom-right)

### Responsive Design
- [ ] Desktop layout (≥768px) — multi-panel
- [ ] Mobile layout (<768px) — tabbed
- [ ] useResponsive hook
- [ ] Responsive components

### Services
- [ ] API client service
- [ ] WebSocket subscription service
- [ ] Room state management
- [ ] User state management
- [ ] Queue state management

### Components
- [ ] Button component
- [ ] Modal component
- [ ] SearchBar component
- [ ] User list component
- [ ] Queue list component
- [ ] Playback controls

## 📱 Phase 7: Controller App

### Screens
- [ ] LoginScreen (nickname + room ID)
- [ ] SecondaryAuthScreen (password + passcode)
- [ ] DashboardScreen (now playing + reservations)
- [ ] SongBookScreen (browse database)
- [ ] SuggestionScreen (YouTube search)
- [ ] ManualURLScreen (direct URL entry)
- [ ] EnhancementScreen (metadata editing)

### Services
- [ ] API client service
- [ ] WebSocket subscription service
- [ ] Song search service
- [ ] Metadata extraction service

### Components
- [ ] Search bar
- [ ] Song list
- [ ] Metadata editor
- [ ] Song card

## 🎥 Phase 8: Player App

### Video Playback Layer
- [ ] VideoPlayer component
- [ ] Full-screen video display
- [ ] Handle aspect ratio/scaling
- [ ] Error handling for playback

### Scoring Layer
- [ ] Scoring modal component
- [ ] Display random score (70-100)
- [ ] Show song metadata
- [ ] Dismiss button

### UI Overlays
- [ ] Queue display (right-to-left scroll)
- [ ] Show now-playing with 🎤 emoji
- [ ] PSA/message scroll
- [ ] QR code display
- [ ] Room ID display

### Player Controls Overlay
- [ ] Play/Pause button
- [ ] Skip button
- [ ] Seek bar with current time
- [ ] Volume slider
- [ ] Mute button
- [ ] Auto-hide on inactivity

### Services
- [ ] WebSocket subscription service
- [ ] Video player state management
- [ ] Queue state management

## 🔗 Phase 9: Integration

### Cross-App Communication
- [ ] Admin → Server → Player (playback commands)
- [ ] Server → All Clients (WebSocket events)
- [ ] Controller → Server (queue requests)
- [ ] Server → Admin/Player (queue updates)

### State Synchronization
- [ ] Playback position sync
- [ ] Queue sync across all clients
- [ ] User presence sync
- [ ] Volume control sync
- [ ] Player availability sync

### Error Handling
- [ ] Network error recovery
- [ ] Reconnection logic
- [ ] Graceful degradation
- [ ] User-friendly error messages

## ✨ Phase 10: Polish & Optimization

### Testing
- [ ] Unit tests for services
- [ ] Integration tests for routes
- [ ] Component tests for UI
- [ ] End-to-end tests
- [ ] Load testing

### Performance
- [ ] Optimize database queries
- [ ] Add caching where appropriate
- [ ] Optimize asset loading
- [ ] Reduce bundle sizes
- [ ] Implement pagination

### Code Quality
- [ ] Lint all code
- [ ] Remove console logs
- [ ] Add error logging
- [ ] Document complex functions
- [ ] Code review process

### Security
- [ ] Validate all inputs
- [ ] Sanitize SQL/NoSQL queries
- [ ] Implement rate limiting
- [ ] Add CORS configuration
- [ ] Use HTTPS in production
- [ ] Secure WebSocket (WSS)

### Deployment
- [ ] Docker image optimization
- [ ] Environment-specific configs
- [ ] Health check endpoints
- [ ] Logging and monitoring
- [ ] Backup strategy

## 🎯 Additional Tasks

### Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Contributing guide
- [ ] Code style guide

### Monitoring
- [ ] Server health checks
- [ ] Error tracking
- [ ] Performance monitoring
- [ ] User analytics
- [ ] Room usage statistics

### Future Features
- [ ] Song scoring system (real)
- [ ] User recommendations
- [ ] Song ratings
- [ ] Replay functionality
- [ ] Multi-room federation

---

## Progress Summary

**Completed:** Foundation & Scaffolding (Phase 1)  
**Next:** Server Core (Phase 2)  
**Status:** Ready to implement!

Print this checklist and check off items as you complete them. Good luck! 🚀
