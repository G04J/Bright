import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IngestHealthDto } from '../../dtos/user/userDataIngestion.dto';
import { buildUtcDateRange } from '../../utils/dateRange.util';
import { PrismaClient, ActivityType, MacroType, MicroType } from '@prisma/client';


function parseDDMMYYYY(s: string): Date {
  // expects "DD-MM-YYYY"
  const [dd, mm, yyyy] = s.split('-').map(Number);
  if (!dd || !mm || !yyyy) throw new Error('Invalid date');
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  // basic sanity check
  if (d.getUTCFullYear() !== yyyy || d.getUTCMonth() !== mm - 1 || d.getUTCDate() !== dd) {
    throw new Error('Invalid date');
  }
  return d; 
}

function addDaysUTC(d: Date, days: number) {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}
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

    return this.prisma.$transaction(async (tx) => {
      const created: Record<string, string> = {};

      /**
       * Activity ingestion.
       * Creates an activity entry and stores individual metrics such as steps,
       * cardio minutes, and strength minutes.
       */
      if (dto.activity) {
        const entry = await tx.activityEntry.create({
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
          await tx.activityMetric.createMany({ data: metrics });
        }

        created.activityEntryId = entry.id;
      }

      /**
       * Food ingestion.
       * Stores calorie totals directly on the food entry and macronutrients
       * in a separate normalized metrics table.
       */
      if (dto.food) {
        const entry = await tx.foodEntry.create({
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
          await tx.foodMetric.createMany({ data: macros });
        }

        created.foodEntryId = entry.id;
      }

      /**
       * Sleep ingestion.
       * Stores sleep duration and quality for the given timestamp.
       */
      if (dto.sleep) {
        const entry = await tx.sleepEntry.create({
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
        const entry = await tx.heartEntry.create({
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
        const entry = await tx.microEntry.create({
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
          await tx.microMetric.createMany({ data: micros });
        }

        created.microEntryId = entry.id;
      }

      /**
       * Hydration ingestion.
       * Stores total water intake in liters.
       */
      if (dto.hydration) {
        const entry = await tx.hydrationEntry.create({
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
        const entry = await tx.weightEntry.create({
          data: {
            userId,
            timestamp,
            weightKg: dto.weight.weightKg ?? null,
          },
        });

        created.weightEntryId = entry.id;
      }

      // Build or refresh the daily summary for this user's day (same day as timestamp)
      await this.rebuildDailySummaryForDay(tx as any, userId, timestamp);

      return {
        message: 'Health data ingested successfully',
        userId,
        timestamp: timestamp.toISOString(),
        created,
      };
    });
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
  
  private async rebuildDailySummaryForDay(
    prisma: PrismaClient,
    userId: string,
    timestamp: Date,
  ) {
    const { start, end } = dayBoundsUTC(timestamp);

    // Fetch everything for that day (simple approach, easy to reason about)
    const [activities, foods, sleeps, hearts, micros, hydrations, weights] =
      await Promise.all([
        prisma.activityEntry.findMany({
          where: { userId, timestamp: { gte: start, lt: end } },
          include: { metrics: true },
        }),
        prisma.foodEntry.findMany({
          where: { userId, timestamp: { gte: start, lt: end } },
          include: { metrics: true },
        }),
        prisma.sleepEntry.findMany({
          where: { userId, timestamp: { gte: start, lt: end } },
        }),
        prisma.heartEntry.findMany({
          where: { userId, timestamp: { gte: start, lt: end } },
        }),
        prisma.microEntry.findMany({
          where: { userId, timestamp: { gte: start, lt: end } },
          include: { metrics: true },
        }),
        prisma.hydrationEntry.findMany({
          where: { userId, timestamp: { gte: start, lt: end } },
        }),
        prisma.weightEntry.findMany({
          where: { userId, timestamp: { gte: start, lt: end } },
          orderBy: { timestamp: 'desc' },
          take: 1,
        }),
      ]);

    // Activity totals
    const activityMetrics = activities.flatMap((e) => e.metrics);
    const stepsTotal = sum(activityMetrics.filter((m) => m.type === ActivityType.STEPS).map((m) => m.value));
    const cardioMinutes = sum(activityMetrics.filter((m) => m.type === ActivityType.CARDIO).map((m) => m.value));
    const strengthMinutes = sum(activityMetrics.filter((m) => m.type === ActivityType.STRENGTH).map((m) => m.value));

    // Food
    const caloriesValues = foods.map((f) => f.calories).filter((v): v is number => v !== null && v !== undefined);
    const caloriesAvg = caloriesValues.length ? sum(caloriesValues) / caloriesValues.length : 0;

    const foodMetrics = foods.flatMap((f) => f.metrics);
    const carbsGrams = sum(foodMetrics.filter((m) => m.type === MacroType.CARBS).map((m) => m.grams));
    const fatsGrams = sum(foodMetrics.filter((m) => m.type === MacroType.FAT).map((m) => m.grams));
    const proteinGrams = sum(foodMetrics.filter((m) => m.type === MacroType.PROTEIN).map((m) => m.grams));

    // Sleep
    const sleepHoursValues = sleeps.map((s) => s.hours).filter((v): v is number => v !== null && v !== undefined);
    const sleepQualityValues = sleeps.map((s) => s.quality).filter((v): v is number => v !== null && v !== undefined);

    const sleepHours = avg(sleepHoursValues);
    const sleepQualityAvg = avg(sleepQualityValues);

    // Heart
    const bpmValues = hearts.map((h) => h.bpm).filter((v): v is number => v !== null && v !== undefined);
    const restingBpmValues = hearts
      .filter((h) => h.resting)
      .map((h) => h.bpm)
      .filter((v): v is number => v !== null && v !== undefined);

    const bpmAvg = avg(bpmValues);
    const restingBpmAvg = avg(restingBpmValues);

    // Micros
    const microMetrics = micros.flatMap((m) => m.metrics);
    const potassiumMg = sum(microMetrics.filter((m) => m.type === MicroType.POTASSIUM).map((m) => m.amountMg));
    const calciumMg = sum(microMetrics.filter((m) => m.type === MicroType.CALCIUM).map((m) => m.amountMg));
    const sodiumMg = sum(microMetrics.filter((m) => m.type === MicroType.SODIUM).map((m) => m.amountMg));

    // Hydration
    const hydrationLiters = sum(
      hydrations.map((h) => h.liters).filter((v): v is number => v !== null && v !== undefined),
    );

    // Weight (latest of the day)
    const weightKg = weights.length ? weights[0].weightKg ?? null : null;

    // day column must be a Date-only value. We store UTC midnight.
    const day = start;

    // Upsert into daily_summaries
    return prisma.dailySummary.upsert({
      where: { userId_day: { userId, day } },
      create: {
        userId,
        day,
        stepsTotal: Math.round(stepsTotal),
        cardioMinutes: Math.round(cardioMinutes),
        strengthMinutes: Math.round(strengthMinutes),

        caloriesAvg,
        carbsGrams,
        fatsGrams,
        proteinGrams,

        sleepHours,
        sleepQualityAvg,

        restingBpmAvg,
        bpmAvg,

        potassiumMg,
        calciumMg,
        sodiumMg,

        hydrationLiters,
        weightKg,
      },
      update: {
        stepsTotal: Math.round(stepsTotal),
        cardioMinutes: Math.round(cardioMinutes),
        strengthMinutes: Math.round(strengthMinutes),

        caloriesAvg,
        carbsGrams,
        fatsGrams,
        proteinGrams,

        sleepHours,
        sleepQualityAvg,

        restingBpmAvg,
        bpmAvg,

        potassiumMg,
        calciumMg,
        sodiumMg,

        hydrationLiters,
        weightKg,
      },
    });
  }

  async getBasicSummary(userId: string, start: string, end: string) {
    let startDate: Date;
    let endDate: Date;

    try {
      startDate = parseDDMMYYYY(start);
      endDate = parseDDMMYYYY(end);
    } catch {
      throw new BadRequestException('start and end must be DD-MM-YYYY');
    }

    if (endDate < startDate) {
      throw new BadRequestException('end must be after or equal to start');
    }

    // For Date-only columns, use [start, end+1day) so we include the full end day
    const endExclusive = addDaysUTC(endDate, 1);

    const rows = await this.prisma.dailySummary.findMany({
      where: {
        userId,
        day: { gte: startDate, lt: endExclusive },
      },
      orderBy: { day: 'asc' },
    });

    const totalSteps = rows.reduce((acc, r) => acc + (r.stepsTotal ?? 0), 0);

    // caloriesAvg is non-nullable in your schema, so treat missing days as "not present"
    const caloriesValues = rows.map((r) => r.caloriesAvg).filter((v) => typeof v === 'number');
    const caloriesRows = rows.filter((r) => r.caloriesAvg !== null && r.caloriesAvg !== undefined && r.caloriesAvg > 0);

const averageCalories =
  caloriesRows.length > 0
    ? caloriesRows.reduce((a, r) => a + r.caloriesAvg, 0) / caloriesRows.length
    : 0;


    const sleepValues = rows
      .map((r) => r.sleepHours)
      .filter((v): v is number => v !== null && v !== undefined);

    const averageSleepHours =
      sleepValues.length > 0 ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length : null;

    // Optional extras (handy for readme/demo)
    const cardioMinutesTotal = rows.reduce((acc, r) => acc + (r.cardioMinutes ?? 0), 0);
    const strengthMinutesTotal = rows.reduce((acc, r) => acc + (r.strengthMinutes ?? 0), 0);
    const hydrationTotal = rows.reduce((acc, r) => acc + (r.hydrationLiters ?? 0), 0);

    return {
      userId,
      range: { start, end },
      totals: {
        totalSteps,
        cardioMinutesTotal,
        strengthMinutesTotal,
        hydrationTotal,
      },
      averages: {
        averageCalories,
        averageSleepHours,
      },
      daysCount: rows.length,
    };
  }

}

function dayBoundsUTC(input: Date) {
  const start = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function avg(numbers: number[]) {
  if (numbers.length === 0) return null;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function sum(numbers: number[]) {
  return numbers.reduce((a, b) => a + b, 0);
}

