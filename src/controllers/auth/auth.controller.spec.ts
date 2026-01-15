import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../../services/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('register calls AuthService.register and returns result', async () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    const serviceResponse = {
      userId: 'user-123',
      email: dto.email,
      token: 'jwt-token',
      message: 'User registered successfully',
    };

    mockAuthService.register.mockResolvedValueOnce(serviceResponse);

    const result = await controller.register(dto);

    expect(mockAuthService.register).toHaveBeenCalledWith(dto.email, dto.password);
    expect(result).toEqual(serviceResponse);
  });

  it('login calls AuthService.login and returns result', async () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    const serviceResponse = {
      userId: 'user-123',
      email: dto.email,
      token: 'jwt-token',
      message: 'Login successful',
    };

    mockAuthService.login.mockResolvedValueOnce(serviceResponse);

    const result = await controller.login(dto);

    expect(mockAuthService.login).toHaveBeenCalledWith(dto.email, dto.password);
    expect(result).toEqual(serviceResponse);
  });

  it('login propagates AuthService errors', async () => {
    const dto = { email: 'test@example.com', password: 'wrongpassword' };

    mockAuthService.login.mockRejectedValueOnce(new Error('Invalid email or password'));

    await expect(controller.login(dto)).rejects.toThrow('Invalid email or password');
  });
});
