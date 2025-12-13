import request from "supertest";
import express from "express";
import { MongoClient, Db } from "mongodb";
import { connectToDatabase } from "../db/connection";

describe("Server Runtime Integration Tests", () => {
  let app: express.Application;
  let db: Db;
  let mongoClient: MongoClient;
  const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

  beforeAll(async () => {
    // Connect to test database
    db = await connectToDatabase();
    
    // Clean test database before running tests
    await db.dropDatabase();
    console.log("✓ Test database cleaned");
  });

  afterAll(async () => {
    // Clean up and close connections
    if (db) {
      await db.dropDatabase();
    }
    if (mongoClient) {
      await mongoClient.close();
    }
  });

  describe("Health Check", () => {
    it("should return 200 and status ok", async () => {
      const response = await request(BASE_URL).get("/health");
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("timestamp");
      expect(typeof response.body.timestamp).toBe("number");
    });
  });

  describe("API Documentation", () => {
    it("should serve Swagger UI at /api-docs", async () => {
      const response = await request(BASE_URL).get("/api-docs/");
      
      expect(response.status).toBe(200);
      expect(response.text).toContain("swagger-ui");
    });
  });

  describe("Authentication Endpoints", () => {
    describe("POST /auth/admin/login", () => {
      it("should login with valid admin credentials", async () => {
        const response = await request(BASE_URL)
          .post("/auth/admin/login")
          .send({
            nickname: process.env.DEFAULT_ADMIN_USERNAME || "admin",
            password: process.env.DEFAULT_ADMIN_PASSWORD || "P@ssw0rd!",
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("user");
        expect(response.body.user.role).toBe("admin");
      });

      it("should reject invalid credentials", async () => {
        const response = await request(BASE_URL)
          .post("/auth/admin/login")
          .send({
            nickname: "admin",
            password: "wrongpassword",
          });

        expect(response.status).toBe(401);
      });
    });
  });

  describe("Room Endpoints", () => {
    let adminToken: string;

    beforeAll(async () => {
      // Login as admin to get token
      const loginResponse = await request(BASE_URL)
        .post("/auth/admin/login")
        .send({
          nickname: process.env.DEFAULT_ADMIN_USERNAME || "admin",
          password: process.env.DEFAULT_ADMIN_PASSWORD || "P@ssw0rd!",
        });
      
      adminToken = loginResponse.body.token;
    });

    describe("POST /rooms", () => {
      it("should create a new room with valid admin token", async () => {
        const response = await request(BASE_URL)
          .post("/rooms")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            passcodeProtected: false,
            sessionStarted: false,
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("roomNumber");
        expect(response.body).toHaveProperty("qrCode");
        expect(response.body.roomNumber).toMatch(/^\d{6}$/); // 6-digit room number
      });

      it("should reject room creation without token", async () => {
        const response = await request(BASE_URL)
          .post("/rooms")
          .send({
            passcodeProtected: false,
            sessionStarted: false,
          });

        expect(response.status).toBe(401);
      });
    });

    describe("GET /rooms/:roomId", () => {
      let roomId: string;

      beforeAll(async () => {
        // Create a test room
        const createResponse = await request(BASE_URL)
          .post("/rooms")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            passcodeProtected: false,
            sessionStarted: false,
          });
        
        roomId = createResponse.body.id;
      });

      it("should get room details with valid ID", async () => {
        const response = await request(BASE_URL)
          .get(`/rooms/${roomId}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("id", roomId);
        expect(response.body).toHaveProperty("roomNumber");
        expect(response.body).toHaveProperty("status");
      });

      it("should return 404 for non-existent room", async () => {
        const response = await request(BASE_URL)
          .get("/rooms/nonexistent-id")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
      });
    });
  });

  describe("Queue Endpoints", () => {
    let adminToken: string;
    let roomId: string;

    beforeAll(async () => {
      // Login as admin
      const loginResponse = await request(BASE_URL)
        .post("/auth/admin/login")
        .send({
          nickname: process.env.DEFAULT_ADMIN_USERNAME || "admin",
          password: process.env.DEFAULT_ADMIN_PASSWORD || "P@ssw0rd!",
        });
      
      adminToken = loginResponse.body.token;

      // Create a room
      const roomResponse = await request(BASE_URL)
        .post("/rooms")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          passcodeProtected: false,
          sessionStarted: true, // Start session to enable queue
        });
      
      roomId = roomResponse.body.id;
    });

    describe("GET /queue/:roomId", () => {
      it("should get empty queue for new room", async () => {
        const response = await request(BASE_URL)
          .get(`/queue/${roomId}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for unknown endpoints", async () => {
      const response = await request(BASE_URL).get("/unknown-endpoint");
      
      expect(response.status).toBe(404);
    });

    it("should handle malformed JSON gracefully", async () => {
      const response = await request(BASE_URL)
        .post("/auth/admin/login")
        .set("Content-Type", "application/json")
        .send("{ invalid json");

      expect(response.status).toBe(400);
    });
  });

  describe("CORS", () => {
    it("should have CORS headers enabled", async () => {
      const response = await request(BASE_URL)
        .options("/health")
        .set("Origin", "http://localhost:3001");

      expect(response.headers).toHaveProperty("access-control-allow-origin");
    });
  });
});
