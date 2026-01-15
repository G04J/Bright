import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { userDataIngestionService } from './userDataIngestion.service';
import { PrismaService } from '../prisma/prisma.service';

describe('userDataIngestionService - ingestHealthData', () => {
  let service: userDataIngestionService;

  const prismaMock = {
    activityEntry: { create: jest.fn() },
    activityMetric: { createMany: jest.fn() },
    foodEntry: { create: jest.fn() },
    foodMetric: { createMany: jest.fn() },
    sleepEntry: { create: jest.fn() },
    heartEntry: { create: jest.fn() },
    microEntry: { create: jest.fn() },
    microMetric: { createMany: jest.fn() },
    hydrationEntry: { create: jest.fn() },
    weightEntry: { create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        userDataIngestionService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<userDataIngestionService>(userDataIngestionService);

    jest.clearAllMocks();

    // Default "create" mocks return ids so the service can proceed
    prismaMock.activityEntry.create.mockResolvedValue({ id: 'act_entry_1' });
    prismaMock.foodEntry.create.mockResolvedValue({ id: 'food_entry_1' });
    prismaMock.sleepEntry.create.mockResolvedValue({ id: 'sleep_entry_1' });
    prismaMock.heartEntry.create.mockResolvedValue({ id: 'heart_entry_1' });
    prismaMock.microEntry.create.mockResolvedValue({ id: 'micro_entry_1' });
    prismaMock.hydrationEntry.create.mockResolvedValue({ id: 'hyd_entry_1' });
    prismaMock.weightEntry.create.mockResolvedValue({ id: 'wt_entry_1' });

    prismaMock.activityMetric.createMany.mockResolvedValue({ count: 3 });
    prismaMock.foodMetric.createMany.mockResolvedValue({ count: 3 });
    prismaMock.microMetric.createMany.mockResolvedValue({ count: 3 });
  });

  it('throws 400 if no health sections are provided', async () => {
    await expect(service.ingestHealthData('user-1', {} as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(prismaMock.activityEntry.create).not.toHaveBeenCalled();
    expect(prismaMock.foodEntry.create).not.toHaveBeenCalled();
    expect(prismaMock.sleepEntry.create).not.toHaveBeenCalled();
  });

  it('creates entries and metrics for a full payload', async () => {
    const dto = {
      timestamp: '2026-01-15T00:00:00.000Z',
      activity: { steps: 5000, cardioMinutes: 30, strengthMinutes: 15 },
      food: { calories: 2200, carbsGrams: 250, fatsGrams: 70, proteinGrams: 120 },
      sleep: { hours: 7.5, quality: 4 },
      heart: { bpm: 65, resting: true },
      micros: { potassiumMg: 3500, calciumMg: 1000, sodiumMg: 1800 },
      hydration: { liters: 2.5 },
      weight: { weightKg: 70 },
    };

    const res = await service.ingestHealthData('user-1', dto as any);

    // Entry creation calls
    expect(prismaMock.activityEntry.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', timestamp: new Date(dto.timestamp) },
    });

    expect(prismaMock.foodEntry.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', timestamp: new Date(dto.timestamp), calories: 2200 },
    });

    expect(prismaMock.sleepEntry.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', timestamp: new Date(dto.timestamp), hours: 7.5, quality: 4 },
    });

    expect(prismaMock.heartEntry.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', timestamp: new Date(dto.timestamp), bpm: 65, resting: true },
    });

    expect(prismaMock.microEntry.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', timestamp: new Date(dto.timestamp) },
    });

    expect(prismaMock.hydrationEntry.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', timestamp: new Date(dto.timestamp), liters: 2.5 },
    });

    expect(prismaMock.weightEntry.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', timestamp: new Date(dto.timestamp), weightKg: 70 },
    });

    // Metrics creation calls
    expect(prismaMock.activityMetric.createMany).toHaveBeenCalledWith({
      data: [
        { entryId: 'act_entry_1', type: 'STEPS', value: 5000 },
        { entryId: 'act_entry_1', type: 'CARDIO', value: 30 },
        { entryId: 'act_entry_1', type: 'STRENGTH', value: 15 },
      ],
    });

    expect(prismaMock.foodMetric.createMany).toHaveBeenCalledWith({
      data: [
        { entryId: 'food_entry_1', type: 'CARBS', grams: 250 },
        { entryId: 'food_entry_1', type: 'FAT', grams: 70 },
        { entryId: 'food_entry_1', type: 'PROTEIN', grams: 120 },
      ],
    });

    expect(prismaMock.microMetric.createMany).toHaveBeenCalledWith({
      data: [
        { entryId: 'micro_entry_1', type: 'POTASSIUM', amountMg: 3500 },
        { entryId: 'micro_entry_1', type: 'CALCIUM', amountMg: 1000 },
        { entryId: 'micro_entry_1', type: 'SODIUM', amountMg: 1800 },
      ],
    });

    // Response includes created IDs
    expect(res).toEqual(
      expect.objectContaining({
        message: 'Health data ingested successfully',
        userId: 'user-1',
        created: expect.objectContaining({
          activityEntryId: 'act_entry_1',
          foodEntryId: 'food_entry_1',
          sleepEntryId: 'sleep_entry_1',
          heartEntryId: 'heart_entry_1',
          microEntryId: 'micro_entry_1',
          hydrationEntryId: 'hyd_entry_1',
          weightEntryId: 'wt_entry_1',
        }),
      }),
    );
  });

  it('does not create metrics when activity values are missing', async () => {
    const dto = {
      timestamp: '2026-01-15T00:00:00.000Z',
      activity: {}, // no steps/cardio/strength
    };

    await service.ingestHealthData('user-1', dto as any);

    expect(prismaMock.activityEntry.create).toHaveBeenCalled();
    expect(prismaMock.activityMetric.createMany).not.toHaveBeenCalled();
  });

  it('stores heart resting as false by default when not provided', async () => {
    const dto = {
      timestamp: '2026-01-15T00:00:00.000Z',
      heart: { bpm: 72 }, // resting omitted
    };

    await service.ingestHealthData('user-1', dto as any);

    expect(prismaMock.heartEntry.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', timestamp: new Date(dto.timestamp), bpm: 72, resting: false },
    });
  });
});
