import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeadlineType } from '../interfaces/deadline-type.enum';

export enum TodoStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export class UpdateTodoDto {
  @ApiProperty({
    example: 'Review Chapter 1',
    description: 'Content of the todo',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    example: '2026-01-20T00:00:00Z',
    description: 'Due date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    enum: TodoStatus,
    example: TodoStatus.COMPLETED,
    description: 'Status of the todo',
    required: false,
  })
  @IsOptional()
  @IsEnum(TodoStatus)
  status?: TodoStatus;

  @ApiProperty({
    example: 'Important for exam',
    description: 'Reason for the todo',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    enum: DeadlineType,
    example: DeadlineType.SHORT_TERM,
    description: 'Deadline type (SHORT_TERM or LONG_TERM)',
    required: false,
  })
  @IsOptional()
  @IsEnum(DeadlineType)
  deadlineType?: DeadlineType;
}
