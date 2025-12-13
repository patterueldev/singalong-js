import { AuthService } from '../auth';
import { UserRepository, RoomRepository } from '../../db/repositories';
import { User, Room, UserRole } from 'singalong-shared';
import * as authUtils from '../../utils/auth';

// Mock the repositories
jest.mock('../../db/repositories');
jest.mock('../../utils/auth');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockRoomRepo: jest.Mocked<RoomRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock repository instances
    mockUserRepo = new UserRepository(null as any) as jest.Mocked<UserRepository>;
    mockRoomRepo = new RoomRepository(null as any) as jest.Mocked<RoomRepository>;

    // Create service instance
    authService = new AuthService(mockUserRepo, mockRoomRepo);
  });

  describe('adminLogin', () => {
    it('should successfully login admin with valid credentials', async () => {
      // Arrange
      const mockAdmin: User = {
        id: 'admin-123',
        nickname: 'admin',
        passwordHash: 'hashed_password',
        role: UserRole.ADMIN,

        lastActivity: Date.now(),
        songHistory: [],
      };

      mockUserRepo.findByNickname = jest.fn().mockResolvedValue(mockAdmin);
      mockUserRepo.update = jest.fn().mockResolvedValue(mockAdmin);
      (authUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (authUtils.generateSessionToken as jest.Mock).mockReturnValue('session-token-123');

      // Act
      const result = await authService.adminLogin('admin', 'password');

      // Assert
      expect(result).toEqual({
        user: mockAdmin,
        sessionToken: 'session-token-123',
      });
      expect(mockUserRepo.findByNickname).toHaveBeenCalledWith('admin');
      expect(authUtils.comparePassword).toHaveBeenCalledWith('password', 'hashed_password');
      expect(mockUserRepo.update).toHaveBeenCalledWith('admin-123', expect.objectContaining({
        lastActivity: expect.any(Number),
      }));
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockUserRepo.findByNickname = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(authService.adminLogin('nonexistent', 'password'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user is not admin', async () => {
      // Arrange
      const mockUser: User = {
        id: 'user-123',
        nickname: 'regularuser',
        passwordHash: 'hashed_password',
        role: UserRole.USER,

        lastActivity: Date.now(),
        songHistory: [],
      };

      mockUserRepo.findByNickname = jest.fn().mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.adminLogin('regularuser', 'password'))
        .rejects.toThrow('Not an admin user');
    });

    it('should throw error if admin has no password', async () => {
      // Arrange
      const mockAdmin: User = {
        id: 'admin-123',
        nickname: 'admin',
        passwordHash: undefined,
        role: UserRole.ADMIN,
        roomId: undefined,
        joinedAt: undefined,
        lastActivity: Date.now(),
        songHistory: [],
      };

      mockUserRepo.findByNickname = jest.fn().mockResolvedValue(mockAdmin);

      // Act & Assert
      await expect(authService.adminLogin('admin', 'password'))
        .rejects.toThrow('Admin must have password');
    });

    it('should throw error if password is invalid', async () => {
      // Arrange
      const mockAdmin: User = {
        id: 'admin-123',
        nickname: 'admin',
        passwordHash: 'hashed_password',
        role: UserRole.ADMIN,
        lastActivity: Date.now(),
        songHistory: [],
      };

      mockUserRepo.findByNickname = jest.fn().mockResolvedValue(mockAdmin);
      (authUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.adminLogin('admin', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('joinRoom', () => {
    it('should successfully join room with new user', async () => {
      // Arrange
      const mockRoom: Room = {
        id: 'room-123',
        roomNumber: '123456',
        passcodeProtected: false,
        qrCode: 'qr-code-data',
        createdBy: 'admin-123',
        createdAt: Date.now(),
        sessionStarted: true,
        status: 'active',
      };

      mockRoomRepo.findByRoomNumber = jest.fn().mockResolvedValue(mockRoom);
      mockUserRepo.findByNickname = jest.fn().mockResolvedValue(null);
      mockUserRepo.create = jest.fn().mockResolvedValue({
        id: 'user-123',
        nickname: 'newuser',
        role: UserRole.USER,
        roomId: 'room-123',
        joinedAt: Date.now(),
        lastActivity: Date.now(),
        songHistory: [],
      });
      (authUtils.generateSessionToken as jest.Mock).mockReturnValue('session-token-456');

      // Act
      const result = await authService.joinRoom('newuser', '123456');

      // Assert
      expect(result.user.nickname).toBe('newuser');
      expect(result.sessionToken).toBe('session-token-456');
      expect(mockRoomRepo.findByRoomNumber).toHaveBeenCalledWith('123456');
      expect(mockUserRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        nickname: 'newuser',
        role: UserRole.USER,
        roomId: 'room-123',
      }));
    });

    it('should throw error if room not found', async () => {
      // Arrange
      mockRoomRepo.findByRoomNumber = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(authService.joinRoom('user', 'invalid-room'))
        .rejects.toThrow('Room not found');
    });

    it('should throw error if room has ended', async () => {
      // Arrange
      const mockRoom: Room = {
        id: 'room-123',
        roomNumber: '123456',
        passcodeProtected: false,
        qrCode: 'qr-code-data',
        createdBy: 'admin-123',
        createdAt: Date.now(),
        sessionStarted: true,
        status: 'ended',
      };

      mockRoomRepo.findByRoomNumber = jest.fn().mockResolvedValue(mockRoom);

      // Act & Assert
      await expect(authService.joinRoom('user', '123456'))
        .rejects.toThrow('Room has ended');
    });

    it('should throw error if nickname is already taken', async () => {
      // Arrange
      const mockRoom: Room = {
        id: 'room-123',
        roomNumber: '123456',
        passcodeProtected: false,
        qrCode: 'qr-code-data',
        createdBy: 'admin-123',
        createdAt: Date.now(),
        sessionStarted: true,
        status: 'active',
      };

      const existingUser: User = {
        id: 'user-existing',
        nickname: 'takenname',
        passwordHash: undefined,
        role: UserRole.USER,
        roomId: 'room-123',
        joinedAt: Date.now() - 1000,
        lastActivity: Date.now(),
        songHistory: [],
      };

      mockRoomRepo.findByRoomNumber = jest.fn().mockResolvedValue(mockRoom);
      mockUserRepo.findByNickname = jest.fn().mockResolvedValue(existingUser);

      // Act & Assert
      await expect(authService.joinRoom('takenname', '123456'))
        .rejects.toThrow('Already in this room');
    });

    it('should require room passcode if room is protected', async () => {
      // Arrange
      const mockRoom: Room = {
        id: 'room-123',
        roomNumber: '123456',
        passcodeProtected: true,
        passcode: 'hashed_passcode',
        qrCode: 'qr-code-data',
        createdBy: 'admin-123',
        createdAt: Date.now(),
        sessionStarted: true,
        status: 'active',
      };

      mockRoomRepo.findByRoomNumber = jest.fn().mockResolvedValue(mockRoom);

      // Act & Assert
      await expect(authService.joinRoom('user', '123456', undefined, undefined))
        .rejects.toThrow('Room passcode required');
    });

    it('should validate room passcode if provided', async () => {
      // Arrange
      const mockRoom: Room = {
        id: 'room-123',
        roomNumber: '123456',
        passcodeProtected: true,
        passcode: 'hashed_passcode',
        qrCode: 'qr-code-data',
        createdBy: 'admin-123',
        createdAt: Date.now(),
        sessionStarted: true,
        status: 'active',
      };

      mockRoomRepo.findByRoomNumber = jest.fn().mockResolvedValue(mockRoom);
      (authUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.joinRoom('user', '123456', undefined, 'wrongcode'))
        .rejects.toThrow('Invalid room passcode');
    });
  });
});
