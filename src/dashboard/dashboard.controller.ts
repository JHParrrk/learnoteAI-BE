import {
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoResponseDto } from './dto/todo-response.dto';
import { LearningTodo } from './interfaces/todo.interface';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard summary for current user' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary retrieved successfully',
    type: DashboardSummaryDto,
  })
  async getDashboard(
    @Req() req: RequestWithUser,
  ): Promise<DashboardSummaryDto> {
    try {
      return await this.dashboardService.getDashboardSummary(req.user.userId);
    } catch (error) {
      console.error('Error in getDashboard:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve dashboard summary.',
      );
    }
  }

  @Get('todos')
  @ApiOperation({ summary: 'Get all todos for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of todos',
    type: [TodoResponseDto],
  })
  async getTodos(@Req() req: RequestWithUser): Promise<LearningTodo[]> {
    return this.dashboardService.getTodos(req.user.userId);
  }

  @Post('todos')
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiResponse({
    status: 201,
    description: 'Todo created successfully',
    type: TodoResponseDto,
  })
  async createTodo(
    @Req() req: RequestWithUser,
    @Body() createTodoDto: CreateTodoDto,
  ): Promise<LearningTodo> {
    return this.dashboardService.createTodo(req.user.userId, createTodoDto);
  }

  @Patch('todos/:id')
  @ApiOperation({ summary: 'Update a todo' })
  @ApiResponse({
    status: 200,
    description: 'Todo updated successfully',
    type: TodoResponseDto,
  })
  async updateTodo(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<LearningTodo> {
    return this.dashboardService.updateTodo(
      req.user.userId,
      Number(id),
      updateTodoDto,
    );
  }

  @Delete('todos/:id')
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiResponse({
    status: 200,
    description: 'Todo deleted successfully',
  })
  async deleteTodo(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.dashboardService.deleteTodo(req.user.userId, Number(id));
  }
}
