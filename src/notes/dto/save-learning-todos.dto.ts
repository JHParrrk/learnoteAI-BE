import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DeadlineType } from '../../dashboard/interfaces/deadline-type.enum';

export class LearningTodoItemDto {
  @ApiProperty({
    example: 'Complete TypeScript tutorial',
    description: 'The task content',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: 'Identified as a gap in current knowledge',
    description: 'The reason for this todo item',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    example: '2026-01-20',
    description: 'The target date for the task',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

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

export class SaveLearningTodosDto {
  @ApiProperty({
    type: [LearningTodoItemDto],
    description: 'A list of todos to be saved',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LearningTodoItemDto)
  todos: LearningTodoItemDto[];
}
