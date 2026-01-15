import { BadRequestException } from '@nestjs/common';

export function parseDDMMYYYY(input: string): Date {
  const [dd, mm, yyyy] = input.split('-').map((x) => Number(x));
  const d = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0, 0));

  if (
    Number.isNaN(d.getTime()) ||
    d.getUTCFullYear() !== yyyy ||
    d.getUTCMonth() !== mm - 1 ||
    d.getUTCDate() !== dd
  ) {
    throw new BadRequestException(`Invalid date: ${input}. Use DD-MM-YYYY`);
  }

  return d;
}

/**
 * Returns a range where start is inclusive and end is exclusive.
 * End becomes the next day at 00:00:00 UTC.
 */
export function buildUtcDateRange(
  start: string,
  end: string,
): { gte: Date; lt: Date } {
  const startDate = parseDDMMYYYY(start);
  const endDate = parseDDMMYYYY(end);

  const endExclusive = new Date(endDate);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  if (startDate > endExclusive) {
    throw new BadRequestException('start must be on or before end');
  }

  return { gte: startDate, lt: endExclusive };
}
