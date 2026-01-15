import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetSummaryQueryDto {
  @ApiProperty({
    description: 'Start date for the summary period',
    example: '01-01-2024',
    pattern: '^\\d{2}-\\d{2}-\\d{4}$',
    required: true,
  })
  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, { message: 'start must be DD-MM-YYYY' })
  start!: string;

  @ApiProperty({
    description: 'End date for the summary period',
    example: '31-01-2024',
    pattern: '^\\d{2}-\\d{2}-\\d{4}$',
    required: true,
  })
  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, { message: 'end must be DD-MM-YYYY' })
  end!: string;
}
