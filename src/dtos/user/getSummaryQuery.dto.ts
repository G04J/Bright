import { IsString, Matches } from 'class-validator';

export class GetSummaryQueryDto {
  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, { message: 'start must be DD-MM-YYYY' })
  start!: string;

  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, { message: 'end must be DD-MM-YYYY' })
  end!: string;
}
