import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import express from 'express';

import { UserDataIngestionController } from './userDataIngestion.controller';
import { userDataIngestionService } from '../../services/user/userDataIngestion.service';

// Change this import path to your real DTO location
import { GetHealthDataQueryDto } from '../../dtos/user/getHealthDataQuery.dto';

// Request type that extends express.Request with authenticated user data
type AuthedRequest = Partial<express.Request> & {
  user: {
    userId: string;
  };
};

type UserDataIngestionServiceMock = {
  getHealthDataMergedByTimestamp: jest.Mock;
  ingestHealthData: jest.Mock;
};

describe('UserDataIngestionController (GET health-data)', () => {
  let controller: UserDataIngestionController;

  const mockuserDataIngestionService: UserDataIngestionServiceMock = {
    getHealthDataMergedByTimestamp: jest.fn(),
    ingestHealthData: jest.fn(),
  };

  beforeEach(() => {
    // Reset mocks per test
    mockuserDataIngestionService.getHealthDataMergedByTimestamp.mockReset();
    mockuserDataIngestionService.ingestHealthData.mockReset();
  });

  beforeEach((): void => {
    // Nest testing module compilation is async, so keep this separate async block
  });

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

    const query: GetHealthDataQueryDto = {
      start: '15-01-2026',
      end: '19-01-2026',
      page: 1,
      limit: 50,
    };

    const req: AuthedRequest = {
      user: { userId: 'different-user' },
    };

    expect(() =>
      controller.getHealthData(userIdParam, query, req as express.Request),
    ).toThrow(ForbiddenException);
  });

  it('should call service with correct parameters when authorized', async () => {
    const userIdParam = '0c7973e2-f162-493d-8871-9a6cab7a246c';

    const query: GetHealthDataQueryDto = {
      start: '15-01-2026',
      end: '19-01-2026',
      page: 2,
      limit: 10,
    };

    const req: AuthedRequest = {
      user: { userId: userIdParam },
    };

    const expectedResponse = {
      userId: userIdParam,
      items: [],
      pagination: {
        page: 2,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: true,
      },
      range: { start: query.start, end: query.end },
    };

    mockuserDataIngestionService.getHealthDataMergedByTimestamp.mockResolvedValueOnce(
      expectedResponse,
    );

    const result = await controller.getHealthData(
      userIdParam,
      query,
      req as express.Request,
    );

    expect(
      mockuserDataIngestionService.getHealthDataMergedByTimestamp,
    ).toHaveBeenCalledWith(
      userIdParam,
      query.start,
      query.end,
      query.page,
      query.limit,
    );

    expect(result).toEqual(expectedResponse);
  });

  it('should use the query dto values passed in', async () => {
    const userIdParam = 'user-123';

    const query: GetHealthDataQueryDto = {
      start: '15-01-2026',
      end: '15-01-2026',
      page: 1,
      limit: 50,
    };

    const req: AuthedRequest = {
      user: { userId: userIdParam },
    };

    mockuserDataIngestionService.getHealthDataMergedByTimestamp.mockResolvedValueOnce(
      { ok: true },
    );

    await controller.getHealthData(userIdParam, query, req as express.Request);

    expect(
      mockuserDataIngestionService.getHealthDataMergedByTimestamp,
    ).toHaveBeenCalledWith(
      userIdParam,
      query.start,
      query.end,
      query.page,
      query.limit,
    );
  });
});
