import { QueueService } from '../queue';
import { QueueRepository, SongRepository, RoomRepository } from '../../db/repositories';
import { ReservedSong, Song, Room } from 'singalong-shared';

jest.mock('../../db/repositories');

describe('QueueService', () => {
  let queueService: QueueService;
  let mockQueueRepo: jest.Mocked<QueueRepository>;
  let mockSongRepo: jest.Mocked<SongRepository>;
  let mockRoomRepo: jest.Mocked<RoomRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQueueRepo = new QueueRepository(null as any) as jest.Mocked<QueueRepository>;
    mockSongRepo = new SongRepository(null as any) as jest.Mocked<SongRepository>;
    mockRoomRepo = new RoomRepository(null as any) as jest.Mocked<RoomRepository>;

    queueService = new QueueService(mockQueueRepo, mockSongRepo, mockRoomRepo);
  });

  describe('addSongToQueue', () => {
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

    const mockSong: Song = {
      id: 'song-123',
      title: 'Test Song',
      artist: 'Test Artist',
      duration: 180000,
      language: 'en',
      fileUrl: 'https://example.com/song.mp4',
      provider: 'youtube',
      providerId: 'abc123',
      tags: ['rock'],
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should add song to empty queue and start playing immediately', async () => {
      // Arrange
      mockRoomRepo.findById = jest.fn().mockResolvedValue(mockRoom);
      mockSongRepo.findById = jest.fn().mockResolvedValue(mockSong);
      mockQueueRepo.findByRoomId = jest.fn().mockResolvedValue([]);
      mockQueueRepo.create = jest.fn().mockResolvedValue({
        id: 'queue-item-123',
        roomId: 'room-123',
        songId: 'song-123',
        reservedBy: 'user-123',
        status: 'playing',
        addedAt: Date.now(),
        startedAt: Date.now(),
      });

      // Act
      const result = await queueService.addSongToQueue('room-123', 'song-123', 'user-123');

      // Assert
      expect(result.status).toBe('playing');
      expect(result.startedAt).toBeDefined();
      expect(mockQueueRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        status: 'playing',
        startedAt: expect.any(Number),
      }));
    });

    it('should add song to non-empty queue with pending status', async () => {
      // Arrange
      const existingQueueItem: ReservedSong = {
        id: 'queue-item-existing',
        roomId: 'room-123',
        songId: 'song-existing',
        reservedBy: 'user-existing',
        status: 'playing',
        addedAt: Date.now() - 10000,
        startedAt: Date.now() - 10000,
      };

      mockRoomRepo.findById = jest.fn().mockResolvedValue(mockRoom);
      mockSongRepo.findById = jest.fn().mockResolvedValue(mockSong);
      mockQueueRepo.findByRoomId = jest.fn().mockResolvedValue([existingQueueItem]);
      mockQueueRepo.create = jest.fn().mockResolvedValue({
        id: 'queue-item-123',
        roomId: 'room-123',
        songId: 'song-123',
        reservedBy: 'user-123',
        status: 'pending',
        addedAt: Date.now(),
      });

      // Act
      const result = await queueService.addSongToQueue('room-123', 'song-123', 'user-123');

      // Assert
      expect(result.status).toBe('pending');
      expect(result.startedAt).toBeUndefined();
      expect(mockQueueRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        status: 'pending',
        startedAt: undefined,
      }));
    });

    it('should throw error if room not found', async () => {
      // Arrange
      mockRoomRepo.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(queueService.addSongToQueue('nonexistent', 'song-123', 'user-123'))
        .rejects.toThrow('Room not found');
    });

    it('should throw error if room has ended', async () => {
      // Arrange
      const endedRoom = { ...mockRoom, status: 'ended' as const };
      mockRoomRepo.findById = jest.fn().mockResolvedValue(endedRoom);

      // Act & Assert
      await expect(queueService.addSongToQueue('room-123', 'song-123', 'user-123'))
        .rejects.toThrow('Room has ended');
    });

    it('should throw error if song not found', async () => {
      // Arrange
      mockRoomRepo.findById = jest.fn().mockResolvedValue(mockRoom);
      mockSongRepo.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(queueService.addSongToQueue('room-123', 'nonexistent', 'user-123'))
        .rejects.toThrow('Song not found');
    });
  });

  describe('getQueue', () => {
    it('should return queue items for room', async () => {
      // Arrange
      const mockQueue: ReservedSong[] = [
        {
          id: 'queue-item-1',
          roomId: 'room-123',
          songId: 'song-1',
          reservedBy: 'user-1',
          status: 'playing',
          addedAt: Date.now() - 10000,
          startedAt: Date.now() - 10000,
        },
        {
          id: 'queue-item-2',
          roomId: 'room-123',
          songId: 'song-2',
          reservedBy: 'user-2',
          status: 'pending',
          addedAt: Date.now(),
        },
      ];

      mockQueueRepo.findByRoomId = jest.fn().mockResolvedValue(mockQueue);

      // Act
      const result = await queueService.getQueue('room-123');

      // Assert
      expect(result).toEqual(mockQueue);
      expect(mockQueueRepo.findByRoomId).toHaveBeenCalledWith('room-123');
    });

    it('should return empty array if no queue items', async () => {
      // Arrange
      mockQueueRepo.findByRoomId = jest.fn().mockResolvedValue([]);

      // Act
      const result = await queueService.getQueue('room-123');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('playPause', () => {
    it('should toggle song status from playing to pending', async () => {
      // Arrange
      const mockQueueItem: ReservedSong = {
        id: 'queue-item-123',
        roomId: 'room-123',
        songId: 'song-123',
        reservedBy: 'user-123',
        status: 'playing',
        addedAt: Date.now(),
        startedAt: Date.now(),
      };

      mockQueueRepo.findById = jest.fn().mockResolvedValue(mockQueueItem);
      mockQueueRepo.update = jest.fn().mockResolvedValue({
        ...mockQueueItem,
        status: 'pending',
      });

      // Act
      const result = await queueService.playPause('queue-item-123', 'user-123', false);

      // Assert
      expect(result.status).toBe('pending');
      expect(mockQueueRepo.update).toHaveBeenCalledWith('queue-item-123', {
        status: 'pending',
      });
    });

    it('should toggle song status from pending to playing', async () => {
      // Arrange
      const mockQueueItem: ReservedSong = {
        id: 'queue-item-123',
        roomId: 'room-123',
        songId: 'song-123',
        reservedBy: 'user-123',
        status: 'pending',
        addedAt: Date.now(),
        startedAt: Date.now(),
      };

      mockQueueRepo.findById = jest.fn().mockResolvedValue(mockQueueItem);
      mockQueueRepo.update = jest.fn().mockResolvedValue({
        ...mockQueueItem,
        status: 'playing',
      });

      // Act
      const result = await queueService.playPause('queue-item-123', 'user-123', false);

      // Assert
      expect(result.status).toBe('playing');
    });

    it('should throw error if queue item not found', async () => {
      // Arrange
      mockQueueRepo.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(queueService.playPause('nonexistent', 'user-123', false))
        .rejects.toThrow('Queue item not found');
    });

    it('should throw error if user tries to control someone elses song', async () => {
      // Arrange
      const mockQueueItem: ReservedSong = {
        id: 'queue-item-123',
        roomId: 'room-123',
        songId: 'song-123',
        reservedBy: 'user-123',
        status: 'playing',
        addedAt: Date.now(),
        startedAt: Date.now(),
      };

      mockQueueRepo.findById = jest.fn().mockResolvedValue(mockQueueItem);

      // Act & Assert
      await expect(queueService.playPause('queue-item-123', 'other-user', false))
        .rejects.toThrow('Can only control your own songs');
    });
  });

  describe('skipSong', () => {
    it('should mark current song as completed and play next', async () => {
      // Arrange
      const currentSong: ReservedSong = {
        id: 'queue-item-1',
        roomId: 'room-123',
        songId: 'song-1',
        reservedBy: 'user-1',
        status: 'playing',
        addedAt: Date.now() - 10000,
        startedAt: Date.now() - 10000,
      };

      const nextSong: ReservedSong = {
        id: 'queue-item-2',
        roomId: 'room-123',
        songId: 'song-2',
        reservedBy: 'user-2',
        status: 'pending',
        addedAt: Date.now(),
      };

      mockQueueRepo.findById = jest.fn().mockResolvedValue(currentSong);
      mockQueueRepo.findByRoomId = jest.fn().mockResolvedValue([currentSong, nextSong]);
      mockQueueRepo.update = jest.fn()
        .mockResolvedValueOnce({ ...currentSong, status: 'completed', completedAt: Date.now() })
        .mockResolvedValueOnce({ ...nextSong, status: 'playing', startedAt: Date.now() });

      // Act
      await queueService.skipSong('queue-item-1', 'user-1', false);

      // Assert
      expect(mockQueueRepo.update).toHaveBeenCalledTimes(2);
      expect(mockQueueRepo.update).toHaveBeenCalledWith('queue-item-1', {
        status: 'completed',
        completedAt: expect.any(Number),
      });
      expect(mockQueueRepo.update).toHaveBeenCalledWith('queue-item-2', {
        status: 'playing',
        startedAt: expect.any(Number),
      });
    });

    it('should complete current song without error if no next song', async () => {
      // Arrange
      const currentSong: ReservedSong = {
        id: 'queue-item-1',
        roomId: 'room-123',
        songId: 'song-1',
        reservedBy: 'user-1',
        status: 'playing',
        addedAt: Date.now(),
        startedAt: Date.now(),
      };

      mockQueueRepo.findById = jest.fn().mockResolvedValue(currentSong);
      mockQueueRepo.findByRoomId = jest.fn().mockResolvedValue([currentSong]);
      mockQueueRepo.update = jest.fn().mockResolvedValue({
        ...currentSong,
        status: 'completed',
        completedAt: Date.now(),
      });

      // Act
      await queueService.skipSong('queue-item-1', 'user-1', false);

      // Assert
      expect(mockQueueRepo.update).toHaveBeenCalledTimes(1);
      expect(mockQueueRepo.update).toHaveBeenCalledWith('queue-item-1', {
        status: 'completed',
        completedAt: expect.any(Number),
      });
    });

    it('should throw error if queue item not found', async () => {
      // Arrange
      mockQueueRepo.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(queueService.skipSong('nonexistent', 'user-1', false))
        .rejects.toThrow('Queue item not found');
    });
  });

  describe('cancelSong', () => {
    it('should cancel a pending song', async () => {
      // Arrange
      const mockQueueItem: ReservedSong = {
        id: 'queue-item-123',
        roomId: 'room-123',
        songId: 'song-123',
        reservedBy: 'user-123',
        status: 'pending',
        addedAt: Date.now(),
      };

      mockQueueRepo.findById = jest.fn().mockResolvedValue(mockQueueItem);
      mockQueueRepo.update = jest.fn().mockResolvedValue({
        ...mockQueueItem,
        status: 'cancelled',
      });

      // Act
      await queueService.cancelSong('queue-item-123', 'user-123', false);

      // Assert
      expect(mockQueueRepo.update).toHaveBeenCalledWith('queue-item-123', {
        status: 'cancelled',
        completedAt: expect.any(Number),
      });
    });

    it('should throw error if trying to cancel playing song', async () => {
      // Arrange
      const mockQueueItem: ReservedSong = {
        id: 'queue-item-123',
        roomId: 'room-123',
        songId: 'song-123',
        reservedBy: 'user-123',
        status: 'playing',
        addedAt: Date.now(),
        startedAt: Date.now(),
      };

      mockQueueRepo.findById = jest.fn().mockResolvedValue(mockQueueItem);

      // Act & Assert
      await expect(queueService.cancelSong('queue-item-123', 'user-123', false))
        .rejects.toThrow('Cannot cancel currently playing song. Use skip instead.');
    });
  });
});
