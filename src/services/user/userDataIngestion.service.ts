import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IngestHealthDto } from '../../dtos/user/userDataIngestion.dto';

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
}
