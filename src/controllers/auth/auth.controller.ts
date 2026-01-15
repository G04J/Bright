// auth.controller.ts
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from '../../services/auth/auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from '../../dtos/auth/register.dto';
import { LoginDto } from '../../dtos/auth/login.dto';

/**
 * Controller handling authentication-related endpoints.
 * Provides user registration and login functionality.
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Registers a new user in the system.
   *
   * @param dto - Registration data containing email and password
   * @returns Object with userId, email, JWT token, and success message
   * @throws {BadRequestException} If user with email already exists
   *
   * @example
   * POST /auth/register
   * Body: { "email": "user@example.com", "password": "password123" }
   */
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  /**
   * Authenticates a user with email and password.
   *
   * @param dto - Login credentials containing email and password
   * @returns Object with userId, email, JWT token, and success message
   * @throws {UnauthorizedException} If credentials are invalid
   *
   * @example
   * POST /auth/login
   * Body: { "email": "user@example.com", "password": "password123" }
   */
  @HttpCode(200)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}
