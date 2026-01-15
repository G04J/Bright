import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { UserDataIngestionController } from './userDataIngestion.controller';
import { userDataIngestionService } from '../../services/user/userDataIngestion.service';

describe('UserDataIngestionController (GET health-data)', () => {
  let controller: UserDataIngestionController;

  const mockuserDataIngestionService = {
    getHealthDataMergedByTimestamp: jest.fn(),
    ingestHealthData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserDataIngestionController],
      providers: [
        {
          provide: userDataIngestionService,
          useValue: mockuserDataIngestionService,
        },
      ],
    }).compile();

    controller = module.get<UserDataIngestionController>(UserDataIngestionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should forbid if token userId does not match param userId', async () => {
    const userIdParam = 'user-abc';
    const query = { start: '15-01-2026', end: '19-01-2026', page: 1, limit: 50 } as any;

    const req = {
      user: { userId: 'different-user' },
    } as any;

    expect(() => controller.getHealthData(userIdParam, query, req)).toThrow(ForbiddenException);
  });

  it('should call service with correct parameters when authorized', async () => {
    const userIdParam = '0c7973e2-f162-493d-8871-9a6cab7a246c';
    const query = { start: '15-01-2026', end: '19-01-2026', page: 2, limit: 10 } as any;

    const req = {
      user: { userId: userIdParam },
    } as any;

    const expectedResponse = {
      userId: userIdParam,
      items: [],
      pagination: { page: 2, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: true },
      range: { start: query.start, end: query.end },
    };

    mockuserDataIngestionService.getHealthDataMergedByTimestamp.mockResolvedValueOnce(expectedResponse);

    const result = await controller.getHealthData(userIdParam, query, req);

    expect(mockuserDataIngestionService.getHealthDataMergedByTimestamp).toHaveBeenCalledWith(
      userIdParam,
      query.start,
      query.end,
      query.page,
      query.limit,
    );
    expect(result).toEqual(expectedResponse);
  });

  it('should default to whatever query dto provides', async () => {
    const userIdParam = 'user-123';
    const query = { start: '15-01-2026', end: '15-01-2026', page: 1, limit: 50 } as any;

    const req = {
      user: { userId: userIdParam },
    } as any;

    mockuserDataIngestionService.getHealthDataMergedByTimestamp.mockResolvedValueOnce({ ok: true });

    await controller.getHealthData(userIdParam, query, req);

    expect(mockuserDataIngestionService.getHealthDataMergedByTimestamp).toHaveBeenCalledWith(
      userIdParam,
      query.start,
      query.end,
      query.page,
      query.limit,
    );
  });
});
