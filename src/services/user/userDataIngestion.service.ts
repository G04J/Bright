import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IngestHealthDto } from '../../dtos/user/userDataIngestion.dto';
import { buildUtcDateRange } from '../../utils/dateRange.util';

type MergedHealthItem = {
  timestamp: string;

  activity?: { steps?: number; cardioMinutes?: number; strengthMinutes?: number };
  food?: { calories?: number | null; carbsGrams?: number; fatsGrams?: number; proteinGrams?: number };
  sleep?: { hours?: number | null; quality?: number | null };
  heart?: { bpm?: number | null; resting?: boolean };
  micros?: { potassiumMg?: number; calciumMg?: number; sodiumMg?: number };
  hydration?: { liters?: number | null };
  weight?: { weightKg?: number | null };
};


/**
 * Service responsible for ingesting and persisting user health data.
 *
 * This service validates incoming health payloads and stores each health category
 * in its respective table using Prisma. All writes are associated with a user and
 * a timestamp. Only the sections present in the request are persisted.
 */
@Injectable()
export class userDataIngestionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ingests health data for a given user.
   *
   * At least one health data section must be provided. The method creates entries
   * for activity, food, sleep, heart, micronutrients, hydration, and weight as
   * applicable. Metrics are stored in normalized tables where relevant.
   *
   * @param userId The authenticated user identifier
   * @param dto The health ingestion payload
   * @returns A summary of created records and their identifiers
   * @throws BadRequestException If no health data sections are provided
   */
  async ingestHealthData(userId: string, dto: IngestHealthDto) {
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    const hasAny =
      dto.activity ||
      dto.food ||
      dto.sleep ||
      dto.heart ||
      dto.micros ||
      dto.hydration ||
      dto.weight;

    if (!hasAny) {
      throw new BadRequestException(
        'At least one health data section must be provided',
      );
    }

    const created: Record<string, string> = {};

    /**
     * Activity ingestion.
     * Creates an activity entry and stores individual metrics such as steps,
     * cardio minutes, and strength minutes.
     */
    if (dto.activity) {
      const entry = await this.prisma.activityEntry.create({
        data: { userId, timestamp },
      });

      const metrics: Array<{
        entryId: string;
        type: 'STEPS' | 'CARDIO' | 'STRENGTH';
        value: number;
      }> = [];

      if (dto.activity.steps != null) {
        metrics.push({
          entryId: entry.id,
          type: 'STEPS',
          value: dto.activity.steps,
        });
      }

      if (dto.activity.cardioMinutes != null) {
        metrics.push({
          entryId: entry.id,
          type: 'CARDIO',
          value: dto.activity.cardioMinutes,
        });
      }

      if (dto.activity.strengthMinutes != null) {
        metrics.push({
          entryId: entry.id,
          type: 'STRENGTH',
          value: dto.activity.strengthMinutes,
        });
      }

      if (metrics.length) {
        await this.prisma.activityMetric.createMany({ data: metrics });
      }

      created.activityEntryId = entry.id;
    }

    /**
     * Food ingestion.
     * Stores calorie totals directly on the food entry and macronutrients
     * in a separate normalized metrics table.
     */
    if (dto.food) {
      const entry = await this.prisma.foodEntry.create({
        data: {
          userId,
          timestamp,
          calories: dto.food.calories ?? null,
        },
      });

      const macros: Array<{
        entryId: string;
        type: 'CARBS' | 'FAT' | 'PROTEIN';
        grams: number;
      }> = [];

      if (dto.food.carbsGrams != null) {
        macros.push({
          entryId: entry.id,
          type: 'CARBS',
          grams: dto.food.carbsGrams,
        });
      }

      if (dto.food.fatsGrams != null) {
        macros.push({
          entryId: entry.id,
          type: 'FAT',
          grams: dto.food.fatsGrams,
        });
      }

      if (dto.food.proteinGrams != null) {
        macros.push({
          entryId: entry.id,
          type: 'PROTEIN',
          grams: dto.food.proteinGrams,
        });
      }

      if (macros.length) {
        await this.prisma.foodMetric.createMany({ data: macros });
      }

      created.foodEntryId = entry.id;
    }

    /**
     * Sleep ingestion.
     * Stores sleep duration and quality for the given timestamp.
     */
    if (dto.sleep) {
      const entry = await this.prisma.sleepEntry.create({
        data: {
          userId,
          timestamp,
          hours: dto.sleep.hours ?? null,
          quality: dto.sleep.quality ?? null,
        },
      });

      created.sleepEntryId = entry.id;
    }

    /**
     * Heart ingestion.
     * Stores heart rate information and whether the reading is resting.
     */
    if (dto.heart) {
      const entry = await this.prisma.heartEntry.create({
        data: {
          userId,
          timestamp,
          bpm: dto.heart.bpm ?? null,
          resting: dto.heart.resting ?? false,
        },
      });

      created.heartEntryId = entry.id;
    }

    /**
     * Micronutrient ingestion.
     * Stores potassium, calcium, and sodium values in milligrams.
     */
    if (dto.micros) {
      const entry = await this.prisma.microEntry.create({
        data: { userId, timestamp },
      });

      const micros: Array<{
        entryId: string;
        type: 'POTASSIUM' | 'CALCIUM' | 'SODIUM';
        amountMg: number;
      }> = [];

      if (dto.micros.potassiumMg != null) {
        micros.push({
          entryId: entry.id,
          type: 'POTASSIUM',
          amountMg: dto.micros.potassiumMg,
        });
      }

      if (dto.micros.calciumMg != null) {
        micros.push({
          entryId: entry.id,
          type: 'CALCIUM',
          amountMg: dto.micros.calciumMg,
        });
      }

      if (dto.micros.sodiumMg != null) {
        micros.push({
          entryId: entry.id,
          type: 'SODIUM',
          amountMg: dto.micros.sodiumMg,
        });
      }

      if (micros.length) {
        await this.prisma.microMetric.createMany({ data: micros });
      }

      created.microEntryId = entry.id;
    }

    /**
     * Hydration ingestion.
     * Stores total water intake in liters.
     */
    if (dto.hydration) {
      const entry = await this.prisma.hydrationEntry.create({
        data: {
          userId,
          timestamp,
          liters: dto.hydration.liters ?? null,
        },
      });

      created.hydrationEntryId = entry.id;
    }

    /**
     * Weight ingestion.
     * Stores body weight in kilograms.
     */
    if (dto.weight) {
      const entry = await this.prisma.weightEntry.create({
        data: {
          userId,
          timestamp,
          weightKg: dto.weight.weightKg ?? null,
        },
      });

      created.weightEntryId = entry.id;
    }

    return {
      message: 'Health data ingested successfully',
      userId,
      timestamp: timestamp.toISOString(),
      created,
    };
  }

    /**
   * Retrieves health data merged into one object per exact timestamp.
   * Categories are merged only when timestamps match exactly.
   */
  async getHealthDataMergedByTimestamp(
    userId: string,
    start: string,
    end: string,
    page = 1,
    limit = 50,
  ) {
    const range = buildUtcDateRange(start, end);
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const [activities, foods, sleeps, hearts, micros, hydrations, weights] =
      await Promise.all([
        this.prisma.activityEntry.findMany({
          where: { userId, timestamp: range },
          include: { metrics: true },
          orderBy: { timestamp: 'desc' },
        }),
        this.prisma.foodEntry.findMany({
          where: { userId, timestamp: range },
          include: { metrics: true },
          orderBy: { timestamp: 'desc' },
        }),
        this.prisma.sleepEntry.findMany({
          where: { userId, timestamp: range },
          orderBy: { timestamp: 'desc' },
        }),
        this.prisma.heartEntry.findMany({
          where: { userId, timestamp: range },
          orderBy: { timestamp: 'desc' },
        }),
        this.prisma.microEntry.findMany({
          where: { userId, timestamp: range },
          include: { metrics: true },
          orderBy: { timestamp: 'desc' },
        }),
        this.prisma.hydrationEntry.findMany({
          where: { userId, timestamp: range },
          orderBy: { timestamp: 'desc' },
        }),
        this.prisma.weightEntry.findMany({
          where: { userId, timestamp: range },
          orderBy: { timestamp: 'desc' },
        }),
      ]);

    const byTs = new Map<string, MergedHealthItem>();

    const getOrCreate = (ts: Date) => {
      const key = ts.toISOString();
      const existing = byTs.get(key);
      if (existing) return existing;

      const created: MergedHealthItem = { timestamp: key };
      byTs.set(key, created);
      return created;
    };

    // Activity
    for (const e of activities) {
      const item = getOrCreate(e.timestamp);
      const activity: MergedHealthItem['activity'] = {};

      for (const m of e.metrics) {
        if (m.type === 'STEPS') activity.steps = m.value;
        if (m.type === 'CARDIO') activity.cardioMinutes = m.value;
        if (m.type === 'STRENGTH') activity.strengthMinutes = m.value;
      }

      item.activity = activity;
    }

    // Food
    for (const e of foods) {
      const item = getOrCreate(e.timestamp);
      const food: MergedHealthItem['food'] = { calories: e.calories };

      for (const m of e.metrics) {
        if (m.type === 'CARBS') food.carbsGrams = m.grams;
        if (m.type === 'FAT') food.fatsGrams = m.grams;
        if (m.type === 'PROTEIN') food.proteinGrams = m.grams;
      }

      item.food = food;
    }

    // Sleep
    for (const e of sleeps) {
      const item = getOrCreate(e.timestamp);
      item.sleep = { hours: e.hours, quality: e.quality };
    }

    // Heart
    for (const e of hearts) {
      const item = getOrCreate(e.timestamp);
      item.heart = { bpm: e.bpm, resting: e.resting };
    }

    // Micros
    for (const e of micros) {
      const item = getOrCreate(e.timestamp);
      const microsObj: MergedHealthItem['micros'] = {};

      for (const m of e.metrics) {
        if (m.type === 'POTASSIUM') microsObj.potassiumMg = m.amountMg;
        if (m.type === 'CALCIUM') microsObj.calciumMg = m.amountMg;
        if (m.type === 'SODIUM') microsObj.sodiumMg = m.amountMg;
      }

      item.micros = microsObj;
    }

    // Hydration
    for (const e of hydrations) {
      const item = getOrCreate(e.timestamp);
      item.hydration = { liters: e.liters };
    }

    // Weight
    for (const e of weights) {
      const item = getOrCreate(e.timestamp);
      item.weight = { weightKg: e.weightKg };
    }

    const allItems = Array.from(byTs.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const total = allItems.length;
    const items = allItems.slice(skip, skip + take);

    return {
      userId,
      range: { start, end },
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: page > 1,
      },
      items,
    };
  }
}
