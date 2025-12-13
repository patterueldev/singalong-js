# MongoDB Schema Documentation

This document defines the exact MongoDB collection schemas and their mapping to TypeScript domain models.

## Collections

### `users`

Maps to: `User` interface from `singalong-shared`

```typescript
{
  _id: ObjectId,              // Maps to User.id (string)
  nickname: string,           // UNIQUE index
  passwordHash?: string,      // bcrypt hash (optional)
  role: "admin" | "user",     // UserRole enum
  roomId?: string,            // Current room (optional)
  joinedAt?: number,          // Timestamp ms (optional)
  lastActivity?: number,      // Timestamp ms (optional)
  songHistory?: string[]      // Array of song IDs (optional)
}
```

**Indexes:**
- `{ nickname: 1 }` - unique
- `{ roomId: 1 }` - for queries

---

### `rooms`

Maps to: `Room` interface from `singalong-shared`

```typescript
{
  _id: ObjectId,              // Maps to Room.id (string)
  roomNumber: string,         // 6-digit string, UNIQUE index
  passcodeProtected: boolean,
  passcode?: string,          // bcrypt hash (optional)
  qrCode: string,             // Base64 or URL
  createdBy: string,          // User ID
  createdAt: number,          // Timestamp ms
  sessionStarted: boolean,
  status: "active" | "ended",
  atmosphere?: string         // Optional tag (optional)
}
```

**Indexes:**
- `{ roomNumber: 1 }` - unique
- `{ status: 1, createdAt: -1 }` - for active room queries

---

### `songs`

Maps to: `Song` interface from `singalong-shared`

```typescript
{
  _id: ObjectId,              // Maps to Song.id (string)
  title: string,
  artist: string,
  duration: number,           // Duration in milliseconds
  language?: string,          // ISO language code (optional)
  fileUrl: string,            // MinIO URL or S3 URL
  provider: string,           // "youtube", "spotify", etc.
  providerId: string,         // Provider's internal ID
  lyrics?: string,            // Full lyrics text (optional)
  tags: string[],             // Array of tags
  metadata?: object,          // Flexible JSON object (optional)
  createdAt: number,          // Timestamp ms
  updatedAt: number           // Timestamp ms
}
```

**Indexes:**
- `{ providerId: 1, provider: 1 }` - unique compound
- `{ title: "text", artist: "text" }` - text search
- `{ tags: 1 }` - array index

---

### `queue_items`

Maps to: `ReservedSong` interface from `singalong-shared`

```typescript
{
  _id: ObjectId,              // Maps to ReservedSong.id (string)
  roomId: string,             // FK to rooms
  songId: string,             // FK to songs
  addedBy: string,            // User ID
  status: "pending" | "playing" | "completed" | "cancelled",
  addedAt: number,            // Timestamp ms
  startedAt?: number,         // Timestamp ms (optional)
  completedAt?: number,       // Timestamp ms (optional)
  currentTime?: number        // Playback position in ms (optional)
}
```

**Indexes:**
- `{ roomId: 1, status: 1, addedAt: 1 }` - compound for queue queries
- `{ songId: 1 }` - for lookups

---

### `song_drafts`

Maps to: `SongDraft` interface from `singalong-shared`

```typescript
{
  _id: ObjectId,              // Maps to SongDraft.id (string)
  createdBy: string,          // User ID
  roomId: string,             // Room ID
  providerId: string,         // Provider's song ID
  tempFilePath: string,       // Local filesystem path
  metadata: {                 // Embedded Song object
    title: string,
    artist: string,
    duration: number,
    language?: string,
    // ... other Song fields
  },
  status: "pending" | "completed" | "cancelled",
  createdAt: number,          // Timestamp ms
  expiresAt: number           // Timestamp ms - for cleanup
}
```

**Indexes:**
- `{ expiresAt: 1 }` - TTL index for auto-cleanup
- `{ createdBy: 1, status: 1 }` - for user queries

---

## Important Notes

### Field Name Consistency

⚠️ **CRITICAL:** All MongoDB documents must use the exact field names defined above.

- TypeScript interfaces use `passwordHash`, not `password`
- Always use `_id: ObjectId` in MongoDB, mapped to `id: string` in models
- All timestamps are in **milliseconds** (not seconds)
- Optional fields must use `?` in TypeScript and may be undefined in MongoDB

### ODM Recommendation

**TODO:** Consider migrating to Mongoose or Typegoose for:
- Automatic schema validation
- Type-safe queries
- Consistent field name mapping
- Built-in virtuals for `_id` → `id` conversion
- Schema versioning and migrations

Without an ODM, developers must:
1. Always reference this document when creating/updating records
2. Use the repository layer (never raw MongoDB calls in business logic)
3. Add integration tests to verify field name consistency

### Creating Records

When manually creating records (e.g., in init scripts or tests), use repository methods:

```typescript
// ✅ CORRECT
await userRepo.create({
  nickname: "admin",
  passwordHash: await hashPassword("P@ssw0rd!"),
  role: UserRole.ADMIN,
  createdAt: Date.now(),
  lastActivity: Date.now()
});

// ❌ WRONG - bypasses repository layer
await db.collection("users").insertOne({
  nickname: "admin",
  password: "...",  // WRONG FIELD NAME!
  role: "admin"
});
```

### Type Safety Gap

Current issue: TypeScript spread operators in repositories preserve field names but provide no compile-time validation. Example:

```typescript
// This compiles but creates wrong field in DB:
await userRepo.create({
  nickname: "test",
  password: "hash",  // Should be passwordHash!
  role: UserRole.USER
});
```

**Mitigation:** Use strict TypeScript, enable all compiler checks, and add integration tests.

---

## Schema Changes

When updating schemas:

1. Update TypeScript interface in `/shared/src/models.ts`
2. Update this documentation file
3. Update repository methods if needed
4. Create migration script in `/server/src/db/migrations/`
5. Update tests
6. Bump API version if client-facing changes

---

**Last Updated:** December 13, 2025  
**Schema Version:** 1.0.0
