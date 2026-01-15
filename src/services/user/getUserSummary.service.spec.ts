import { Test, TestingModule } from '@nestjs/testing';
import { userDataIngestionService } from './userDataIngestion.service';
import { PrismaService } from '../prisma/prisma.service';

describe('userDataIngestionService (getBasicSummary)', () => {
  let service: userDataIngestionService;

  const userId = 'test-user-id';

  // Create a typed mock for PrismaService
  const prismaMock = {
    dailySummary: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        userDataIngestionService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get(userDataIngestionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should compute totals and averages correctly', async () => {
    // IMPORTANT: cast to Jest mock so TS allows mockResolvedValueOnce
    (prismaMock.dailySummary.findMany as jest.Mock).mockResolvedValueOnce([
      {
        day: new Date('2026-01-15'),
        stepsTotal: 2,
        cardioMinutes: 3,
        strengthMinutes: 1,
        caloriesAvg: 4,
        sleepHours: 6,
        hydrationLiters: 0,
      },
      {
        day: new Date('2026-01-16'),
        stepsTotal: 4,
        cardioMinutes: 2,
        strengthMinutes: 2,
        caloriesAvg: 6,
        sleepHours: null,
        hydrationLiters: 0,
      },
      {
        day: new Date('2026-01-17'),
        stepsTotal: 0,
        cardioMinutes: 0,
        strengthMinutes: 0,
        caloriesAvg: 0,
        sleepHours: 8,
        hydrationLiters: 0,
      },
    ]);

    const result = await service.getBasicSummary(userId, '15-01-2026', '17-01-2026');

    expect(result.userId).toBe(userId);

    expect(result.totals).toEqual({
      totalSteps: 6,
      cardioMinutesTotal: 5,
      strengthMinutesTotal: 3,
      hydrationTotal: 0,
    });

    expect(result.averages).toEqual({
      averageCalories: 5,   // (4 + 6) / 2 ignoring 0 day
      averageSleepHours: 7, // (6 + 8) / 2 ignoring null
    });

    expect(result.daysCount).toBe(3);
  });

  it('should return zeros when no data exists', async () => {
    (prismaMock.dailySummary.findMany as jest.Mock).mockResolvedValueOnce([]);

    const result = await service.getBasicSummary(userId, '01-01-2026', '31-01-2026');

    expect(result.totals.totalSteps).toBe(0);
    expect(result.averages.averageCalories).toBe(0);
    expect(result.averages.averageSleepHours).toBeNull();
    expect(result.daysCount).toBe(0);
  });
});
