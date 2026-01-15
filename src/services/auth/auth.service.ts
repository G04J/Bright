import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

/**
 * Service responsible for authentication operations including user registration,
 * login, and token validation.
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Registers a new user in the system.
   * 
   * @param email - The email address of the user
   * @param password - The plaintext password to be hashed and stored
   * @returns An object containing userId, email, JWT token, and success message
   * @throws {BadRequestException} If a user with the given email already exists
   * 
   * @example
   * ```typescript
   * const result = await authService.register('user@example.com', 'password123');
   * // Returns: { userId: '...', email: '...', token: '...', message: '...' }
   * ```
   */
  async register(email: string, password: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // Return token
    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      userId: user.id,
      email: user.email,
      token,
      message: 'User registered successfully',
    };
  }

  /**
   * Authenticates a user with email and password.
   * 
   * @param email - The email address of the user
   * @param password - The plaintext password to verify
   * @returns An object containing userId, email, JWT token, and success message
   * @throws {UnauthorizedException} If the email doesn't exist or password is incorrect
   * 
   * @example
   * ```typescript
   * const result = await authService.login('user@example.com', 'password123');
   * // Returns: { userId: '...', email: '...', token: '...', message: '...' }
   * ```
   */
  async login(email: string, password: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Return token
    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      userId: user.id,
      email: user.email,
      token,
      message: 'Login successful',
    };
  }

  /**
   * Validates a JWT token and returns its payload.
   * 
   * @param token - The JWT token to validate
   * @returns The decoded token payload containing user information
   * @throws {UnauthorizedException} If the token is invalid, expired, or malformed
   * 
   * @example
   * ```typescript
   * const payload = await authService.validateToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   * // Returns: { sub: '...', email: '...', iat: ..., exp: ... }
   * ```
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}