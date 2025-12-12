import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/singalong";
  
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db();
    
    console.log("✓ Connected to MongoDB:", db.databaseName);
    
    // Create indexes
    await createIndexes(db);
    
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

async function createIndexes(db: Db): Promise<void> {
  // Room indexes
  await db.collection("rooms").createIndex({ roomNumber: 1 }, { unique: true });
  await db.collection("rooms").createIndex({ status: 1 });
  
  // User indexes
  await db.collection("users").createIndex({ nickname: 1 }, { unique: true });
  await db.collection("users").createIndex({ roomId: 1 });
  
  // Song indexes
  await db.collection("songs").createIndex({ title: "text", artist: "text" });
  await db.collection("songs").createIndex({ provider: 1, providerId: 1 });
  await db.collection("songs").createIndex({ tags: 1 });
  
  // Queue indexes
  await db.collection("queue_items").createIndex({ roomId: 1, status: 1 });
  await db.collection("queue_items").createIndex({ reservedBy: 1 });
  
  // Song drafts indexes
  await db.collection("songDrafts").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("songDrafts").createIndex({ createdBy: 1 });
  
  console.log("✓ Created database indexes");
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDatabase() first.");
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("✓ Closed MongoDB connection");
  }
}
