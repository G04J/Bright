import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

type JwtPayload = {
  sub: string;
  email: string;
};

type PrismaMock = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
};

type JwtMock = {
  sign: jest.Mock;
  verify: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService: PrismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService: JwtMock = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const passwordHash = 'hashedPassword';
      const userId = 'user-123';
      const token = 'jwt-token-123';

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      (bcrypt.hash as unknown as jest.Mock).mockResolvedValueOnce(passwordHash);

      mockPrismaService.user.create.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
      });

      mockJwtService.sign.mockReturnValueOnce(token);

      const result = await service.register(email, password);

      expect(result).toEqual({
        userId,
        email,
        token,
        message: 'User registered successfully',
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: { email, passwordHash },
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: userId,
        email,
      });
    });

    it('should throw BadRequestException if user already exists', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'existing-user-123',
        email,
      });

      await expect(service.register(email, password)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });
  });

  describe('login', () => {
    it('should login user successfully with correct password', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const passwordHash = 'hashedPassword';
      const userId = 'user-123';
      const token = 'jwt-token-123';

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
      });

      (bcrypt.compare as unknown as jest.Mock).mockResolvedValueOnce(true);

      mockJwtService.sign.mockReturnValueOnce(token);

      const result = await service.login(email, password);

      expect(result).toEqual({
        userId,
        email,
        token,
        message: 'Login successful',
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(password, passwordHash);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: userId,
        email,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const email = 'test@example.com';
      const password = 'wrongPassword';
      const passwordHash = 'hashedPassword';

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email,
        passwordHash,
      });

      (bcrypt.compare as unknown as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(password, passwordHash);
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', () => {
      const token = 'valid-jwt-token';
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
      };

      mockJwtService.verify.mockReturnValueOnce(payload);

      const result = service.validateToken(token);

      expect(result).toEqual(payload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
    });
  });
});
