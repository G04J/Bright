import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class GetHealthDataQueryDto {
  @ApiProperty({
    description: 'Start date in DD-MM-YYYY format',
    example: '15-01-2026',
  })
  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, { message: 'start must be DD-MM-YYYY' })
  start!: string;

  @ApiProperty({
    description: 'End date in DD-MM-YYYY format',
    example: '15-01-2026',
  })
  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, { message: 'end must be DD-MM-YYYY' })
  end!: string;

  @ApiProperty({
    description: 'Page number (1-based)',
    required: false,
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? 1 : Number(value)))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Results per page (max 50)',
    required: false,
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? 50 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 50;
}
