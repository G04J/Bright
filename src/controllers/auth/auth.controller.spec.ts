import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../../services/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register with email and password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse = {
        userId: 'user-123',
        email: 'test@example.com',
        token: 'jwt-token',
        message: 'User registered successfully',
      };

      mockAuthService.register.mockResolvedValueOnce(expectedResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
      );
    });

    it('should call authService with correct parameters', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'securepass123',
      };

      mockAuthService.register.mockResolvedValueOnce({
        userId: 'user-456',
        email: 'newuser@example.com',
        token: 'jwt-token-456',
        message: 'User registered successfully',
      });

      await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'newuser@example.com',
        'securepass123',
      );
    });

    it('should return the response from authService.register', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const serviceResponse = {
        userId: 'user-123',
        email: 'test@example.com',
        token: 'jwt-token-123',
        message: 'User registered successfully',
      };

      mockAuthService.register.mockResolvedValueOnce(serviceResponse);

      const result = await controller.register(registerDto);

      expect(result).toBe(serviceResponse);
    });
  });

  describe('login', () => {
    it('should call authService.login with email and password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse = {
        userId: 'user-123',
        email: 'test@example.com',
        token: 'jwt-token',
        message: 'Login successful',
      };

      mockAuthService.login.mockResolvedValueOnce(expectedResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });

    it('should call authService with correct parameters', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'mypassword123',
      };

      mockAuthService.login.mockResolvedValueOnce({
        userId: 'user-789',
        email: 'user@example.com',
        token: 'jwt-token-789',
        message: 'Login successful',
      });

      await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'user@example.com',
        'mypassword123',
      );
    });

    it('should return the response from authService.login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const serviceResponse = {
        userId: 'user-123',
        email: 'test@example.com',
        token: 'jwt-token-123',
        message: 'Login successful',
      };

      mockAuthService.login.mockResolvedValueOnce(serviceResponse);

      const result = await controller.login(loginDto);

      expect(result).toBe(serviceResponse);
    });

    it('should handle login errors from authService', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValueOnce(
        new Error('Invalid email or password'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });

  describe('register error handling', () => {
    it('should handle user already exists error', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      mockAuthService.register.mockRejectedValueOnce(
        new Error('User already exists'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        'User already exists',
      );
    });

    it('should propagate authService errors', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.register.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        'Database error',
      );
    });
  });
});