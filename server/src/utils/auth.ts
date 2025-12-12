import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return uuidv4();
}

export function generateRoomNumber(): string {
  // Generate 6-digit room number (000000-999999)
  return Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
}

export function generateQRCode(roomNumber: string, serverUrl: string): string {
  // In production, would use qrcode library to generate actual QR code
  // For now, return the URL that would be encoded
  return `${serverUrl}/join/${roomNumber}`;
}
