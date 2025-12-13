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
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔧 Initializing Database...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "P@ssw0rd!";
  
  console.log(`📝 Database: ${db.databaseName}`);
  console.log(`👤 Checking for admin user: ${defaultUsername}`);
  
  // Check if admin user already exists
  const usersCollection = db.collection("users");
  
  try {
    // First, count total users in collection
    const totalUsers = await usersCollection.countDocuments();
    console.log(`📊 Total users in collection: ${totalUsers}`);
    
    const adminExists = await usersCollection.findOne({ 
      nickname: defaultUsername,
      role: UserRole.ADMIN
    });
    
    if (adminExists) {
      console.log("✓ Default admin user already exists");
      console.log(`  User ID: ${adminExists._id}`);
      console.log(`  Nickname: ${adminExists.nickname}`);
      console.log(`  Role: ${adminExists.role}`);
      console.log(`  Has passwordHash: ${!!adminExists.passwordHash}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return;
    }
    
    console.log("⚡ No admin user found, creating default admin...");
    console.log(`📊 Users before insert: ${totalUsers}`);
    
    // Create default admin user with correct field names (see SCHEMA.md)
    const passwordHash = await hashPassword(defaultPassword);
    console.log("✓ Password hashed successfully");
    
    const now = Date.now();
    const adminUser = {
      _id: new ObjectId(),
      nickname: defaultUsername,
      passwordHash: passwordHash,  // ✅ CORRECT: passwordHash, not password
      role: UserRole.ADMIN,
      lastActivity: now,
      // Note: roomId, joinedAt, songHistory are optional - omit if not set
    };
    
    console.log("✓ Admin user object created");
    console.log(`  User ID: ${adminUser._id}`);
    
    // Validate before inserting
    validateUserDocument(adminUser);
    console.log("✓ User document validated");
    
    await usersCollection.insertOne(adminUser);
    console.log("✓ Admin user inserted into database");
    
    // Verify insertion
    const verifyCount = await usersCollection.countDocuments();
    console.log(`📊 Users after insert: ${verifyCount}`);
    
    const verifyUser = await usersCollection.findOne({ nickname: defaultUsername });
    if (verifyUser) {
      console.log("✓ Verified admin user exists in database");
      console.log(`  User ID: ${verifyUser._id}`);
    } else {
      console.error("❌ WARNING: Admin user not found after insertion!");
    }
    
    console.log("");
    console.log("✓ Created default admin user:");
    console.log(`  Username: ${defaultUsername}`);
    console.log(`  Password: ${defaultPassword}`);
    console.log("  ⚠️  Please change the default credentials in production!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Error during database initialization:");
    console.error(error);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    throw error;
  }
}
