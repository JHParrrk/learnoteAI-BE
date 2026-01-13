import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Query('userId') userId: string) {
    const numericUserId = Number(userId);
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      throw new BadRequestException('Invalid userId');
    }

    return this.dashboardService.getDashboardSummary(numericUserId);
  }
}
