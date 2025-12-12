import {
  hashPassword,
  comparePassword,
  generateSessionToken,
  generateRoomNumber,
  generateQRCode,
} from '../auth';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      // Arrange
      const password = 'mySecretPassword';
      const hashedPassword = '$2a$10$abcdefghijklmnopqrstuv';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Act
      const result = await hashPassword(password);

      // Assert
      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      // Arrange
      const password = 'mySecretPassword';
      const hash = '$2a$10$abcdefghijklmnopqrstuv';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await comparePassword(password, hash);

      // Assert
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should return false for non-matching passwords', async () => {
      // Arrange
      const password = 'wrongPassword';
      const hash = '$2a$10$abcdefghijklmnopqrstuv';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await comparePassword(password, hash);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('generateSessionToken', () => {
    it('should generate a random session token', () => {
      // Act
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();

      // Assert
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(20);
    });
  });

  describe('generateRoomNumber', () => {
    it('should generate a 6-digit room number', () => {
      // Act
      const roomNumber = generateRoomNumber();

      // Assert
      expect(roomNumber).toMatch(/^\d{6}$/);
      expect(parseInt(roomNumber)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(roomNumber)).toBeLessThanOrEqual(999999);
    });

    it('should generate unique room numbers', () => {
      // Act
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(generateRoomNumber());
      }

      // Assert - should have high uniqueness rate
      expect(numbers.size).toBeGreaterThan(95);
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code data with room number and URL', () => {
      // Arrange
      const roomNumber = '123456';
      const serverUrl = 'http://localhost:3000';

      // Act
      const qrCode = generateQRCode(roomNumber, serverUrl);

      // Assert
      expect(qrCode).toContain(roomNumber);
      expect(qrCode).toContain(serverUrl);
    });

    it('should generate different QR codes for different room numbers', () => {
      // Arrange
      const serverUrl = 'http://localhost:3000';

      // Act
      const qrCode1 = generateQRCode('123456', serverUrl);
      const qrCode2 = generateQRCode('654321', serverUrl);

      // Assert
      expect(qrCode1).not.toBe(qrCode2);
    });
  });
});
