import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';

export class GetDashboardQueryDto {
  @ApiProperty({
    description: 'The ID of the user to get the dashboard for',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  userId: number;

  @ApiPropertyOptional({
    description: 'The year to get the activity for (defaults to current year)',
    example: 2026,
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year?: number;
}
