import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import express from 'express';

import { UserDataIngestionController } from './userDataIngestion.controller';
import { userDataIngestionService } from '../../services/user/userDataIngestion.service';
import { IngestHealthDto } from '../../dtos/user/userDataIngestion.dto';

type AuthedRequestLike = {
  user?: {
    userId?: string;
  };
};

// typed service mock so no implicit any
type UserDataIngestionServiceMock = {
  ingestHealthData: jest.Mock;
  getHealthDataMergedByTimestamp: jest.Mock;
  getBasicSummary: jest.Mock;
};

describe('UserDataIngestionController (POST health-data)', () => {
  let controller: UserDataIngestionController;

  const mockuserDataIngestionService: UserDataIngestionServiceMock = {
    ingestHealthData: jest.fn(),
    getHealthDataMergedByTimestamp: jest.fn(),
    getBasicSummary: jest.fn(),
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

    controller = module.get<UserDataIngestionController>(
      UserDataIngestionController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should forbid if token userId does not match param userId', () => {
    const userIdParam = 'user-abc';

    const dto: IngestHealthDto = {
      timestamp: '2026-01-15T00:00:00.000Z',
      activity: { steps: 10, cardioMinutes: 2, strengthMinutes: 1 },
      food: { calories: 100, carbsGrams: 10, fatsGrams: 2, proteinGrams: 5 },
      sleep: { hours: 7, quality: 4 },
    };

    const reqLike: AuthedRequestLike = {
      user: { userId: 'different-user' },
    };

    const req = reqLike as unknown as express.Request;

    expect(() => controller.ingestHealth(userIdParam, dto, req)).toThrow(
      ForbiddenException,
    );
  });

  it('should call service when authorized', async () => {
    const userIdParam = 'user-abc';

    const dto: IngestHealthDto = {
      timestamp: '2026-01-15T00:00:00.000Z',
      activity: { steps: 10, cardioMinutes: 2, strengthMinutes: 1 },
      food: { calories: 100, carbsGrams: 10, fatsGrams: 2, proteinGrams: 5 },
      sleep: { hours: 7, quality: 4 },
    };

    const reqLike: AuthedRequestLike = {
      user: { userId: userIdParam },
    };

    const req = reqLike as unknown as express.Request;

    mockuserDataIngestionService.ingestHealthData.mockResolvedValueOnce({
      ok: true,
    });

    const result = await controller.ingestHealth(userIdParam, dto, req);

    expect(mockuserDataIngestionService.ingestHealthData).toHaveBeenCalledWith(
      userIdParam,
      dto,
    );
    expect(result).toEqual({ ok: true });
  });
});
