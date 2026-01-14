import {
  Controller,
  Get,
  Query,
  InternalServerErrorException,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { GetDashboardQueryDto } from './dto/get-dashboard-query.dto';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoResponseDto } from './dto/todo-response.dto';
import { LearningTodo } from './interfaces/todo.interface';

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

  @Get('todos')
  @ApiOperation({ summary: 'Get all todos for a user' })
  @ApiResponse({
    status: 200,
    description: 'List of todos',
    type: [TodoResponseDto],
  })
  async getTodos(@Query('userId') userId: string): Promise<LearningTodo[]> {
    const uid = Number(userId);
    return this.dashboardService.getTodos(uid);
  }

  @Post('todos')
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiResponse({
    status: 201,
    description: 'Todo created successfully',
    type: TodoResponseDto,
  })
  async createTodo(
    @Body() createTodoDto: CreateTodoDto,
    @Query('userId') userId: string,
  ): Promise<LearningTodo> {
    // Note: Assuming userId is passed via query as no auth guard yet; ideally from token
    // If CreateTodoDto doesn't have userId, we pass it.
    // Wait, CreateTodoDto doesn't have userId. The service createTodo takes userId separately.
    // The user might not pass userId in body if they are authenticated, but here we are using query param.
    const uid = Number(userId); // Or if we use auth guard, request.user.id
    return this.dashboardService.createTodo(uid, createTodoDto);
  }

  @Patch('todos/:id')
  @ApiOperation({ summary: 'Update a todo' })
  @ApiResponse({
    status: 200,
    description: 'Todo updated successfully',
    type: TodoResponseDto,
  })
  async updateTodo(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @Query('userId') userId: string,
  ): Promise<LearningTodo> {
    const uid = Number(userId);
    return this.dashboardService.updateTodo(uid, Number(id), updateTodoDto);
  }

  @Delete('todos/:id')
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiResponse({
    status: 200,
    description: 'Todo deleted successfully',
  })
  async deleteTodo(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<{ message: string }> {
    const uid = Number(userId);
    return this.dashboardService.deleteTodo(uid, Number(id));
  }
}
