import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IngestHealthDto } from '../../dtos/user/ingest-health.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async ingestHealthData(userId: string, dto: IngestHealthDto) {
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    const hasAny =
      dto.activity || dto.food || dto.sleep || dto.heart || dto.micros || dto.hydration || dto.weight;

    if (!hasAny) {
      throw new BadRequestException('At least one health data section must be provided');
    }

    const created: Record<string, string> = {};

    // Activity
    if (dto.activity) {
      const entry = await this.prisma.activityEntry.create({
        data: { userId, timestamp },
      });

      const metrics: Array<{ entryId: string; type: 'STEPS' | 'CARDIO' | 'STRENGTH'; value: number }> = [];
      if (dto.activity.steps != null) metrics.push({ entryId: entry.id, type: 'STEPS', value: dto.activity.steps });
      if (dto.activity.cardioMinutes != null) metrics.push({ entryId: entry.id, type: 'CARDIO', value: dto.activity.cardioMinutes });
      if (dto.activity.strengthMinutes != null) metrics.push({ entryId: entry.id, type: 'STRENGTH', value: dto.activity.strengthMinutes });

      if (metrics.length) {
        await this.prisma.activityMetric.createMany({ data: metrics });
      }

      created.activityEntryId = entry.id;
    }

    // Food
    if (dto.food) {
      const entry = await this.prisma.foodEntry.create({
        data: {
          userId,
          timestamp,
          calories: dto.food.calories ?? null,
        },
      });

      const macros: Array<{ entryId: string; type: 'CARBS' | 'FAT' | 'PROTEIN'; grams: number }> = [];
      if (dto.food.carbsGrams != null) macros.push({ entryId: entry.id, type: 'CARBS', grams: dto.food.carbsGrams });
      if (dto.food.fatsGrams != null) macros.push({ entryId: entry.id, type: 'FAT', grams: dto.food.fatsGrams });
      if (dto.food.proteinGrams != null) macros.push({ entryId: entry.id, type: 'PROTEIN', grams: dto.food.proteinGrams });

      if (macros.length) {
        await this.prisma.foodMetric.createMany({ data: macros });
      }

      created.foodEntryId = entry.id;
    }

    // Sleep
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

    // Heart
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

    // Micros
    if (dto.micros) {
      const entry = await this.prisma.microEntry.create({
        data: { userId, timestamp },
      });

      const micros: Array<{ entryId: string; type: 'POTASSIUM' | 'CALCIUM' | 'SODIUM'; amountMg: number }> = [];
      if (dto.micros.potassiumMg != null) micros.push({ entryId: entry.id, type: 'POTASSIUM', amountMg: dto.micros.potassiumMg });
      if (dto.micros.calciumMg != null) micros.push({ entryId: entry.id, type: 'CALCIUM', amountMg: dto.micros.calciumMg });
      if (dto.micros.sodiumMg != null) micros.push({ entryId: entry.id, type: 'SODIUM', amountMg: dto.micros.sodiumMg });

      if (micros.length) {
        await this.prisma.microMetric.createMany({ data: micros });
      }

      created.microEntryId = entry.id;
    }

    // Hydration
    if (dto.hydration) {
      const entry = await this.prisma.hydrationEntry.create({
        data: { userId, timestamp, liters: dto.hydration.liters ?? null },
      });
      created.hydrationEntryId = entry.id;
    }

    // Weight
    if (dto.weight) {
      const entry = await this.prisma.weightEntry.create({
        data: { userId, timestamp, weightKg: dto.weight.weightKg ?? null },
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
