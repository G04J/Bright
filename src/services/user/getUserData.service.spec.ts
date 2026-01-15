import { Test, TestingModule } from '@nestjs/testing';
import { userDataIngestionService } from './userDataIngestion.service';
import { PrismaService } from '../prisma/prisma.service';

describe('userDataIngestionService (getHealthDataMergedByTimestamp)', () => {
  let service: userDataIngestionService;

  const prismaMock = {
    activityEntry: { findMany: jest.fn() },
    foodEntry: { findMany: jest.fn() },
    sleepEntry: { findMany: jest.fn() },
    heartEntry: { findMany: jest.fn() },
    microEntry: { findMany: jest.fn() },
    hydrationEntry: { findMany: jest.fn() },
    weightEntry: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        userDataIngestionService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<userDataIngestionService>(userDataIngestionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should merge categories when timestamps match exactly', async () => {
    const userId = 'user-1';
    const ts = new Date('2026-01-18T00:00:00.000Z');

    prismaMock.activityEntry.findMany.mockResolvedValueOnce([
      {
        id: 'a1',
        timestamp: ts,
        metrics: [
          { type: 'STEPS', value: 9000 },
          { type: 'CARDIO', value: 40 },
          { type: 'STRENGTH', value: 25 },
        ],
      },
    ]);

    prismaMock.foodEntry.findMany.mockResolvedValueOnce([
      {
        id: 'f1',
        timestamp: ts,
        calories: 2400,
        metrics: [
          { type: 'CARBS', grams: 300 },
          { type: 'FAT', grams: 80 },
          { type: 'PROTEIN', grams: 140 },
        ],
      },
    ]);

    prismaMock.sleepEntry.findMany.mockResolvedValueOnce([
      { id: 's1', timestamp: ts, hours: 8, quality: 5 },
    ]);

    prismaMock.heartEntry.findMany.mockResolvedValueOnce([
      { id: 'h1', timestamp: ts, bpm: 62, resting: true },
    ]);

    prismaMock.microEntry.findMany.mockResolvedValueOnce([
      {
        id: 'm1',
        timestamp: ts,
        metrics: [
          { type: 'POTASSIUM', amountMg: 3600 },
          { type: 'CALCIUM', amountMg: 1100 },
          { type: 'SODIUM', amountMg: 1700 },
        ],
      },
    ]);

    prismaMock.hydrationEntry.findMany.mockResolvedValueOnce([
      { id: 'hy1', timestamp: ts, liters: 3.1 },
    ]);

    prismaMock.weightEntry.findMany.mockResolvedValueOnce([
      { id: 'w1', timestamp: ts, weightKg: 71.8 },
    ]);

    const result = await service.getHealthDataMergedByTimestamp(userId, '15-01-2026', '19-01-2026', 1, 50);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      timestamp: '2026-01-18T00:00:00.000Z',
      activity: { steps: 9000, cardioMinutes: 40, strengthMinutes: 25 },
      food: { calories: 2400, carbsGrams: 300, fatsGrams: 80, proteinGrams: 140 },
      sleep: { hours: 8, quality: 5 },
      heart: { bpm: 62, resting: true },
      micros: { potassiumMg: 3600, calciumMg: 1100, sodiumMg: 1700 },
      hydration: { liters: 3.1 },
      weight: { weightKg: 71.8 },
    });

    expect(result.pagination.total).toBe(1);
  });

  it('should return separate items when timestamps do not match', async () => {
    const userId = 'user-1';
    const ts1 = new Date('2026-01-18T00:00:00.000Z');
    const ts2 = new Date('2026-01-19T00:00:00.000Z');

    prismaMock.activityEntry.findMany.mockResolvedValueOnce([
      { id: 'a1', timestamp: ts1, metrics: [{ type: 'STEPS', value: 5000 }] },
    ]);
    prismaMock.foodEntry.findMany.mockResolvedValueOnce([]);
    prismaMock.sleepEntry.findMany.mockResolvedValueOnce([
      { id: 's1', timestamp: ts2, hours: 6.5, quality: 3 },
    ]);
    prismaMock.heartEntry.findMany.mockResolvedValueOnce([]);
    prismaMock.microEntry.findMany.mockResolvedValueOnce([]);
    prismaMock.hydrationEntry.findMany.mockResolvedValueOnce([]);
    prismaMock.weightEntry.findMany.mockResolvedValueOnce([]);

    const result = await service.getHealthDataMergedByTimestamp(userId, '15-01-2026', '19-01-2026', 1, 50);

    expect(result.items).toHaveLength(2);

    // Ensure sorted desc
    expect(result.items[0].timestamp).toBe('2026-01-19T00:00:00.000Z');
    expect(result.items[0].sleep).toEqual({ hours: 6.5, quality: 3 });

    expect(result.items[1].timestamp).toBe('2026-01-18T00:00:00.000Z');
    expect(result.items[1].activity).toEqual({ steps: 5000 });
  });

  it('should paginate to max 50 and slice by page', async () => {
    const userId = 'user-1';

    // Create 60 sleep entries (unique timestamps)
    const sleeps = Array.from({ length: 60 }).map((_, i) => {
      const day = 1 + i;
      return {
        id: `s-${i}`,
        timestamp: new Date(Date.UTC(2026, 0, day, 0, 0, 0, 0)),
        hours: 7,
        quality: 4,
      };
    });

    prismaMock.activityEntry.findMany.mockResolvedValueOnce([]);
    prismaMock.foodEntry.findMany.mockResolvedValueOnce([]);
    prismaMock.sleepEntry.findMany.mockResolvedValueOnce(sleeps);
    prismaMock.heartEntry.findMany.mockResolvedValueOnce([]);
    prismaMock.microEntry.findMany.mockResolvedValueOnce([]);
    prismaMock.hydrationEntry.findMany.mockResolvedValueOnce([]);
    prismaMock.weightEntry.findMany.mockResolvedValueOnce([]);

    const page1 = await service.getHealthDataMergedByTimestamp(userId, '01-01-2026', '31-03-2026', 1, 50);
    expect(page1.items).toHaveLength(50);
    expect(page1.pagination.total).toBe(60);
    expect(page1.pagination.totalPages).toBe(2);
    expect(page1.pagination.hasNext).toBe(true);

  });
});
