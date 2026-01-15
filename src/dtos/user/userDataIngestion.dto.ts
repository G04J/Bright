import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ActivityDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) steps?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) cardioMinutes?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  strengthMinutes?: number;
}

class FoodDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) calories?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) carbsGrams?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) fatsGrams?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  proteinGrams?: number;
}

class SleepDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) hours?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) quality?: number;
}

class HeartDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) bpm?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() resting?: boolean;
}

class MicrosDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) potassiumMg?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) calciumMg?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) sodiumMg?: number;
}

class HydrationDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) liters?: number;
}

class WeightDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) weightKg?: number;
}

export class IngestHealthDto {
  @ApiPropertyOptional({ example: '2026-01-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ActivityDto)
  activity?: ActivityDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => FoodDto)
  food?: FoodDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => SleepDto)
  sleep?: SleepDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => HeartDto)
  heart?: HeartDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => MicrosDto)
  micros?: MicrosDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => HydrationDto)
  hydration?: HydrationDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => WeightDto)
  weight?: WeightDto;
}
