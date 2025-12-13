import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../auth';
import { AuthService } from '../../services/auth';
import { User, UserRole } from 'singalong-shared';

// Mock AuthService
jest.mock('../../services/auth');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    mockAuthService = {
      validateSession: jest.fn(),
    } as any;

    // Initialize middleware with mock service
    const { initAuthMiddleware } = require('../auth');
    initAuthMiddleware(mockAuthService);

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  describe('authenticate', () => {
    it('should call next() with valid token', async () => {
      // Arrange
      const validToken = 'valid-session-token';
      const mockUser: User = {
        id: 'user-123',
        nickname: 'testuser',
        role: UserRole.USER,
        lastActivity: Date.now(),
        songHistory: [],
      };

      mockAuthService.validateSession.mockResolvedValue(mockUser);

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should return 401 if no authorization header', async () => {
      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header malformed', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockAuthService.validateSession.mockResolvedValue(null);

      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired session',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
