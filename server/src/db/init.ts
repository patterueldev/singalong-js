import { Db, ObjectId } from "mongodb";
import { UserRole } from "singalong-shared";
import { hashPassword } from "../utils/auth";
import { validateUserDocument } from "./schema-validators";

/**
 * Initialize database with default data on first run
 * 
 * This function is called when the server starts to ensure default admin exists.
 * See SCHEMA.md for field naming conventions.
 */
export async function initializeDatabase(db: Db): Promise<void> {
  console.log("Checking database initialization...");
  
  const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "P@ssw0rd!";
  
  // Check if admin user already exists
  const usersCollection = db.collection("users");
  const adminExists = await usersCollection.findOne({ 
    nickname: defaultUsername,
    role: UserRole.ADMIN
  });
  
  if (adminExists) {
    console.log("✓ Default admin user already exists");
    return;
  }
  
  // Create default admin user with correct field names (see SCHEMA.md)
  const passwordHash = await hashPassword(defaultPassword);
  
  const now = Date.now();
  const adminUser = {
    _id: new ObjectId(),
    nickname: defaultUsername,
    passwordHash: passwordHash,  // ✅ CORRECT: passwordHash, not password
    role: UserRole.ADMIN,
    lastActivity: now,
    // Note: roomId, joinedAt, songHistory are optional - omit if not set
  };
  
  // Validate before inserting
  validateUserDocument(adminUser);
  
  await usersCollection.insertOne(adminUser);
  
  console.log("✓ Created default admin user:");
  console.log(`  Username: ${defaultUsername}`);
  console.log(`  Password: ${defaultPassword}`);
  console.log("  ⚠️  Please change the default credentials in production!");
}
