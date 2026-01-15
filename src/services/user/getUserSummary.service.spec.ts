import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { userDataIngestionService } from './userDataIngestion.service';
import { PrismaService } from '../prisma/prisma.service';

type MockTx = {
  activityEntry: { create: jest.Mock; findMany: jest.Mock };
  activityMetric: { createMany: jest.Mock };

  foodEntry: { create: jest.Mock; findMany: jest.Mock };
  foodMetric: { createMany: jest.Mock };

  sleepEntry: { create: jest.Mock; findMany: jest.Mock };
  heartEntry: { create: jest.Mock; findMany: jest.Mock };

  microEntry: { create: jest.Mock; findMany: jest.Mock };
  microMetric: { createMany: jest.Mock };

  hydrationEntry: { create: jest.Mock; findMany: jest.Mock };
  weightEntry: { create: jest.Mock; findMany: jest.Mock };

  dailySummary: { upsert: jest.Mock };
};

describe('userDataIngestionService', () => {
  let service: userDataIngestionService;

  describe('getHealthDataMergedByTimestamp', () => {
    let prismaMock: any;

    beforeEach(async () => {
      prismaMock = {
        activityEntry: { findMany: jest.fn() },
        foodEntry: { findMany: jest.fn() },
        sleepEntry: { findMany: jest.fn() },
        heartEntry: { findMany: jest.fn() },
        microEntry: { findMany: jest.fn() },
        hydrationEntry: { findMany: jest.fn() },
        weightEntry: { findMany: jest.fn() },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          userDataIngestionService,
          { provide: PrismaService, useValue: prismaMock },
        ],
      }).compile();

      service = module.get<userDataIngestionService>(
        userDataIngestionService,
      );
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

      const result = await service.getHealthDataMergedByTimestamp(
        userId,
        '15-01-2026',
        '19-01-2026',
        1,
        50,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        timestamp: '2026-01-18T00:00:00.000Z',
        activity: { steps: 9000, cardioMinutes: 40, strengthMinutes: 25 },
        food: {
          calories: 2400,
          carbsGrams: 300,
          fatsGrams: 80,
          proteinGrams: 140,
        },
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

      const result = await service.getHealthDataMergedByTimestamp(
        userId,
        '15-01-2026',
        '19-01-2026',
        1,
        50,
      );

      expect(result.items).toHaveLength(2);

      // Ensure sorted desc
      expect(result.items[0].timestamp).toBe('2026-01-19T00:00:00.000Z');
      expect(result.items[0].sleep).toEqual({ hours: 6.5, quality: 3 });

      expect(result.items[1].timestamp).toBe('2026-01-18T00:00:00.000Z');
      expect(result.items[1].activity).toEqual({ steps: 5000 });
    });

    it('should paginate to max 50 and slice by page', async () => {
      const userId = 'user-1';

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

      const page1 = await service.getHealthDataMergedByTimestamp(
        userId,
        '01-01-2026',
        '31-03-2026',
        1,
        50,
      );
      expect(page1.items).toHaveLength(50);
      expect(page1.pagination.total).toBe(60);
      expect(page1.pagination.totalPages).toBe(2);
      expect(page1.pagination.hasNext).toBe(true);

      prismaMock.activityEntry.findMany.mockResolvedValueOnce([]);
      prismaMock.foodEntry.findMany.mockResolvedValueOnce([]);
      prismaMock.sleepEntry.findMany.mockResolvedValueOnce(sleeps);
      prismaMock.heartEntry.findMany.mockResolvedValueOnce([]);
      prismaMock.microEntry.findMany.mockResolvedValueOnce([]);
      prismaMock.hydrationEntry.findMany.mockResolvedValueOnce([]);
      prismaMock.weightEntry.findMany.mockResolvedValueOnce([]);

      const page2 = await service.getHealthDataMergedByTimestamp(
        userId,
        '01-01-2026',
        '31-03-2026',
        2,
        50,
      );
      expect(page2.items).toHaveLength(10);
      expect(page2.pagination.hasNext).toBe(false);
      expect(page2.pagination.hasPrev).toBe(true);
    });
  });

  describe('ingestHealthData', () => {
  const makePrismaMock = () => {
    const tx: MockTx = {
      activityEntry: { create: jest.fn(), findMany: jest.fn() },
      activityMetric: { createMany: jest.fn() },

      foodEntry: { create: jest.fn(), findMany: jest.fn() },
      foodMetric: { createMany: jest.fn() },

      sleepEntry: { create: jest.fn(), findMany: jest.fn() },
      heartEntry: { create: jest.fn(), findMany: jest.fn() },

      microEntry: { create: jest.fn(), findMany: jest.fn() },
      microMetric: { createMany: jest.fn() },

      hydrationEntry: { create: jest.fn(), findMany: jest.fn() },
      weightEntry: { create: jest.fn(), findMany: jest.fn() },

      dailySummary: { upsert: jest.fn() },
    };

    // Summary rebuild reads. Default to no rows for the day.
    tx.activityEntry.findMany.mockResolvedValue([]);
    tx.foodEntry.findMany.mockResolvedValue([]);
    tx.sleepEntry.findMany.mockResolvedValue([]);
    tx.heartEntry.findMany.mockResolvedValue([]);
    tx.microEntry.findMany.mockResolvedValue([]);
    tx.hydrationEntry.findMany.mockResolvedValue([]);
    tx.weightEntry.findMany.mockResolvedValue([]);

    const prisma = {
      $transaction: jest.fn(async (fn: any) => fn(tx)),
    };

    return { prisma, tx };
  };

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-15T00:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.clearAllMocks();
    });

    it('throws BadRequestException when no sections are provided', async () => {
      const { prisma } = makePrismaMock();
      service = new userDataIngestionService(prisma as any);

      await expect(
        service.ingestHealthData('u1', {} as any),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('persists only the provided sections and returns created ids', async () => {
      const { prisma, tx } = makePrismaMock();
      service = new userDataIngestionService(prisma as any);

      tx.activityEntry.create.mockResolvedValueOnce({ id: 'act1' });
      tx.foodEntry.create.mockResolvedValueOnce({ id: 'food1' });
      tx.sleepEntry.create.mockResolvedValueOnce({ id: 'sleep1' });

      tx.activityMetric.createMany.mockResolvedValueOnce({ count: 3 });
      tx.foodMetric.createMany.mockResolvedValueOnce({ count: 3 });

      tx.dailySummary.upsert.mockResolvedValueOnce({ id: 'sum1' });

      const dto = {
        timestamp: '2026-01-15T00:00:00.000Z',
        activity: { steps: 10, cardioMinutes: 2, strengthMinutes: 1 },
        food: { calories: 100, carbsGrams: 10, fatsGrams: 2, proteinGrams: 5 },
        sleep: { hours: 7, quality: 4 },
      };

      const result = await service.ingestHealthData('u1', dto as any);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      expect(tx.activityEntry.create).toHaveBeenCalledWith({
        data: { userId: 'u1', timestamp: new Date('2026-01-15T00:00:00.000Z') },
      });

      expect(tx.foodEntry.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          timestamp: new Date('2026-01-15T00:00:00.000Z'),
          calories: 100,
        },
      });

      expect(tx.sleepEntry.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          timestamp: new Date('2026-01-15T00:00:00.000Z'),
          hours: 7,
          quality: 4,
        },
      });

      expect(tx.activityMetric.createMany).toHaveBeenCalledTimes(1);
      expect(tx.foodMetric.createMany).toHaveBeenCalledTimes(1);

      expect(tx.heartEntry.create).not.toHaveBeenCalled();
      expect(tx.microEntry.create).not.toHaveBeenCalled();
      expect(tx.hydrationEntry.create).not.toHaveBeenCalled();
      expect(tx.weightEntry.create).not.toHaveBeenCalled();

      expect(tx.dailySummary.upsert).toHaveBeenCalledTimes(1);

      expect(result.message).toBe('Health data ingested successfully');
      expect(result.userId).toBe('u1');
      expect(result.timestamp).toBe('2026-01-15T00:00:00.000Z');
      expect(result.created).toEqual({
        activityEntryId: 'act1',
        foodEntryId: 'food1',
        sleepEntryId: 'sleep1',
      });
    });

    it('creates no metrics when metric values are missing (but creates entry)', async () => {
      const { prisma, tx } = makePrismaMock();
      service = new userDataIngestionService(prisma as any);

      tx.activityEntry.create.mockResolvedValueOnce({ id: 'act1' });
      tx.dailySummary.upsert.mockResolvedValueOnce({ id: 'sum1' });

      const dto = {
        timestamp: '2026-01-15T00:00:00.000Z',
        activity: {},
      };

      const result = await service.ingestHealthData('u1', dto as any);

      expect(tx.activityEntry.create).toHaveBeenCalledTimes(1);
      expect(tx.activityMetric.createMany).not.toHaveBeenCalled();

      expect(result.created).toEqual({
        activityEntryId: 'act1',
      });
    });
  });

  describe('getBasicSummary', () => {
    let prismaMock: any;

    beforeEach(async () => {
      prismaMock = {
        dailySummary: {
          findMany: jest.fn(),
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          userDataIngestionService,
          { provide: PrismaService, useValue: prismaMock },
        ],
      }).compile();

      service = module.get<userDataIngestionService>(
        userDataIngestionService,
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('throws if start/end are not DD-MM-YYYY', async () => {
      await expect(
        service.getBasicSummary('u1', '2026-01-01', '31-01-2026'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws if end is before start', async () => {
      await expect(
        service.getBasicSummary('u1', '10-01-2026', '01-01-2026'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return zeros when no data exists', async () => {
      prismaMock.dailySummary.findMany.mockResolvedValueOnce([]);

      const result = await service.getBasicSummary(
        'u1',
        '01-01-2026',
        '31-01-2026',
      );

      expect(result.userId).toBe('u1');
      expect(result.daysCount).toBe(0);
      expect(result.totals.totalSteps).toBe(0);
      expect(result.totals.cardioMinutesTotal).toBe(0);
      expect(result.totals.strengthMinutesTotal).toBe(0);
      expect(result.totals.hydrationTotal).toBe(0);
      expect(result.averages.averageCalories).toBe(0);
      expect(result.averages.averageSleepHours).toBe(0);
    });

    it('should compute totals and averages correctly (ignores zero calories rows for avg)', async () => {
      prismaMock.dailySummary.findMany.mockResolvedValueOnce([
        {
          day: new Date('2026-01-15T00:00:00.000Z'),
          stepsTotal: 2,
          cardioMinutes: 3,
          strengthMinutes: 1,
          hydrationLiters: 0,
          caloriesAvg: 4,
          sleepHours: 6,
        },
        {
          day: new Date('2026-01-16T00:00:00.000Z'),
          stepsTotal: 4,
          cardioMinutes: 2,
          strengthMinutes: 2,
          hydrationLiters: 0,
          caloriesAvg: 6,
          sleepHours: 8,
        },
        {
          day: new Date('2026-01-17T00:00:00.000Z'),
          stepsTotal: 0,
          cardioMinutes: 0,
          strengthMinutes: 0,
          hydrationLiters: 0,
          caloriesAvg: 0,
          sleepHours: null,
        },
      ]);

      const result = await service.getBasicSummary(
        'u1',
        '15-01-2026',
        '17-01-2026',
      );

      expect(result.daysCount).toBe(3);
      expect(result.totals.totalSteps).toBe(6);
      expect(result.totals.cardioMinutesTotal).toBe(5);
      expect(result.totals.strengthMinutesTotal).toBe(3);
      // averageCalories should be (4 + 6) / 2 = 5
      expect(result.averages.averageCalories).toBe(5);
      // sleep average is (6 + 8) / 2 = 7 (null ignored)
      expect(result.averages.averageSleepHours).toBe(7);
    });
  });
});