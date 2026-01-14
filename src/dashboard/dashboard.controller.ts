import {
  Controller,
  Get,
  Query,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { GetDashboardQueryDto } from './dto/get-dashboard-query.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard summary for a user' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary retrieved successfully',
    type: DashboardSummaryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getDashboard(
    @Query() query: GetDashboardQueryDto,
  ): Promise<DashboardSummaryDto> {
    try {
      return await this.dashboardService.getDashboardSummary(query.userId);
    } catch (error) {
      console.error('Error in getDashboard:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve dashboard summary.',
      );
    }
  }
}
