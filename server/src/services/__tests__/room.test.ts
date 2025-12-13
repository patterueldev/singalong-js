import { RoomService } from '../room';
import { RoomRepository, UserRepository, QueueRepository } from '../../db/repositories';
import { Room, User, UserRole } from 'singalong-shared';
import * as authUtils from '../../utils/auth';

jest.mock('../../db/repositories');
jest.mock('../../utils/auth');

describe('RoomService', () => {
  let roomService: RoomService;
  let mockRoomRepo: jest.Mocked<RoomRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRoomRepo = new RoomRepository(null as any) as jest.Mocked<RoomRepository>;
    mockUserRepo = new UserRepository(null as any) as jest.Mocked<UserRepository>;

    roomService = new RoomService(mockRoomRepo, mockUserRepo);
  });

  describe('createRoom', () => {
    it('should successfully create a room with admin', async () => {
      // Arrange
      const mockAdmin: User = {
        id: 'admin-123',
        nickname: 'admin',
        passwordHash: 'hashed_password',
        role: UserRole.ADMIN,
        roomId: undefined,
        joinedAt: undefined,
        lastActivity: Date.now(),
        songHistory: [],
      };

      const mockRoom: Room = {
        id: 'room-123',
        roomNumber: '123456',
        passcodeProtected: false,
        qrCode: 'qr-code-data',
        createdBy: 'admin-123',
        createdAt: Date.now(),
        sessionStarted: false,
        status: 'active',
      };

      mockRoomRepo.findByRoomNumber = jest.fn().mockResolvedValue(null);
      mockRoomRepo.create = jest.fn().mockResolvedValue(mockRoom);
      mockUserRepo.create = jest.fn().mockResolvedValue(mockAdmin);
      (authUtils.generateRoomNumber as jest.Mock).mockReturnValue('123456');
      (authUtils.generateQRCode as jest.Mock).mockReturnValue('qr-code-data');
      (authUtils.hashPassword as jest.Mock).mockResolvedValue('hashed_password');

      // Act
      const result = await roomService.createRoom('admin', 'password123');

      // Assert
      expect(result.room.roomNumber).toBe('123456');
      expect(result.admin.nickname).toBe('admin');
      expect(mockUserRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        nickname: 'admin',
        role: UserRole.ADMIN,
      }));
      expect(mockRoomRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        roomNumber: '123456',
        passcodeProtected: false,
      }));
    });

    it('should create room with passcode protection', async () => {
      // Arrange
      mockRoomRepo.findByRoomNumber = jest.fn().mockResolvedValue(null);
      mockRoomRepo.create = jest.fn().mockResolvedValue({
        id: 'room-123',
        roomNumber: '123456',
        passcodeProtected: true,
        passcode: 'hashed_room_passcode',
        qrCode: 'qr-code-data',
        createdBy: 'admin-123',
        createdAt: Date.now(),
        sessionStarted: false,
        status: 'active',
      });
      mockUserRepo.create = jest.fn().mockResolvedValue({
        id: 'admin-123',
        nickname: 'admin',
        passwordHash: 'hashed_password',
        role: UserRole.ADMIN,
        roomId: null,
        joinedAt: null,
        lastActivity: Date.now(),
        songHistory: [],
      });
      (authUtils.generateRoomNumber as jest.Mock).mockReturnValue('123456');
      (authUtils.generateQRCode as jest.Mock).mockReturnValue('qr-code-data');
      (authUtils.hashPassword as jest.Mock)
        .mockResolvedValueOnce('hashed_password')
        .mockResolvedValueOnce('hashed_room_passcode');

      // Act
      const result = await roomService.createRoom('admin', 'password123', 'roomcode');

      // Assert
      expect(result.room.passcodeProtected).toBe(true);
      expect(authUtils.hashPassword).toHaveBeenCalledTimes(2);
    });

    it('should retry room number generation if collision occurs', async () => {
      // Arrange
      const existingRoom: Room = {
        id: 'room-existing',
        roomNumber: '123456',
        passcodeProtected: false,
        qrCode: 'qr-code-data',
        createdBy: 'admin-123',
        createdAt: Date.now(),
        sessionStarted: false,
        status: 'active',
      };

      mockRoomRepo.findByRoomNumber = jest.fn()
        .mockResolvedValueOnce(existingRoom)
        .mockResolvedValueOnce(null);
      mockRoomRepo.create = jest.fn().mockResolvedValue({
        id: 'room-new',
        roomNumber: '654321',
        passcodeProtected: false,
        qrCode: 'qr-code-data',
        createdBy: 'admin-123',
        createdAt: Date.now(),
        sessionStarted: false,
        status: 'active',
      });
      mockUserRepo.create = jest.fn().mockResolvedValue({
        id: 'admin-123',
        nickname: 'admin',
        passwordHash: 'hashed_password',
        role: UserRole.ADMIN,
        roomId: null,
        joinedAt: null,
        lastActivity: Date.now(),
        songHistory: [],
      });
      (authUtils.generateRoomNumber as jest.Mock)
        .mockReturnValueOnce('123456')
        .mockReturnValueOnce('654321');
      (authUtils.generateQRCode as jest.Mock).mockReturnValue('qr-code-data');
      (authUtils.hashPassword as jest.Mock).mockResolvedValue('hashed_password');

      // Act
      const result = await roomService.createRoom('admin', 'password123');

      // Assert
      expect(mockRoomRepo.findByRoomNumber).toHaveBeenCalledTimes(2);
      expect(result.room.roomNumber).toBe('654321');
    });

    it('should throw error if unable to generate unique room number', async () => {
      // Arrange
      const existingRoom: Room = {
        id: 'room-existing',
        roomNumber: '123456',
        passcodeProtected: false,
        qrCode: 'qr-code-data',
        createdBy: 'admin-123',
        createdAt: Date.now(),
        sessionStarted: false,
        status: 'active',
      };

      mockRoomRepo.findByRoomNumber = jest.fn().mockResolvedValue(existingRoom);
      (authUtils.generateRoomNumber as jest.Mock).mockReturnValue('123456');

      // Act & Assert
      await expect(roomService.createRoom('admin', 'password123'))
        .rejects.toThrow('Failed to generate unique room number');
    });
  });

  describe('startSession', () => {
    it('should start session for active room', async () => {
      // Arrange
      const mockRoom: Room = {
        id: 'room-123',
        roomNumber: '123456',
        passcodeProtected: false,
        qrCode: 'qr-code-data',
        createdBy: 'admin-123',
        createdAt: Date.now(),
        sessionStarted: false,
        status: 'active',
      };

      mockRoomRepo.findById = jest.fn().mockResolvedValue(mockRoom);
      mockRoomRepo.update = jest.fn().mockResolvedValue(true);

      // Act
      const result = await roomService.startSession('room-123', 'admin-123');

      // Assert
      expect(result).toBe(true);
      expect(mockRoomRepo.update).toHaveBeenCalledWith('room-123', {
        sessionStarted: true,
      });
    });

    it('should throw error if room not found', async () => {
      // Arrange
      mockRoomRepo.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(roomService.startSession('nonexistent', 'admin-123'))
        .rejects.toThrow('Room not found');
    });

    it('should throw error if not room creator', async () => {
      // Arrange
      const mockRoom: Room = {
        id: 'room-123',
        roomNumber: '123456',
        passcodeProtected: false,
        qrCode: 'qr-code-data',
        createdBy: 'admin-123',
        createdAt: Date.now(),
        sessionStarted: false,
        status: 'active',
      };

      mockRoomRepo.findById = jest.fn().mockResolvedValue(mockRoom);

      // Act & Assert
      await expect(roomService.startSession('room-123', 'other-admin'))
        .rejects.toThrow('Only room creator can start session');
    });
  });

  describe('endRoom', () => {
    it('should successfully end an active room', async () => {
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

      mockRoomRepo.findById = jest.fn().mockResolvedValue(mockRoom);
      mockRoomRepo.update = jest.fn().mockResolvedValue(true);

      // Act
      const result = await roomService.endRoom('room-123', 'admin-123');

      // Assert
      expect(result).toBe(true);
      expect(mockRoomRepo.update).toHaveBeenCalledWith('room-123', {
        status: 'ended',
      });
    });

    it('should throw error if room not found', async () => {
      // Arrange
      mockRoomRepo.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(roomService.endRoom('nonexistent', 'admin-123'))
        .rejects.toThrow('Room not found');
    });
  });
});
