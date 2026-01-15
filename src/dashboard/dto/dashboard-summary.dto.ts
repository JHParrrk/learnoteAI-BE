import { ApiProperty } from '@nestjs/swagger';

export class ActivityItemDto {
  @ApiProperty({ example: '2026-01-14' })
  date: string;

  @ApiProperty({ example: 5 })
  count: number;

  @ApiProperty({ example: 3, description: 'Activity level (0-4)' })
  level: number;
}

export class DashboardSummaryDto {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 120 })
  totalNotes: number;

  @ApiProperty({ example: 7 })
  currentStreakDays: number;

  @ApiProperty({ example: 15 })
  thisMonthNotes: number;

  @ApiProperty({ type: [ActivityItemDto] })
  activity: ActivityItemDto[];
}
