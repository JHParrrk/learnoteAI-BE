import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeadlineType } from '../interfaces/deadline-type.enum';

export class CreateTodoDto {
  @ApiProperty({
    example: 1,
    description:
      '이 투두를 특정 노트에 연결하려면 이 필드를 입력하세요. 수동으로 생성하려면 비워두세요.',
    required: false,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  noteId?: number;

  @ApiProperty({
    example: 'Review Chapter 1',
    description: 'Content of the todo',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: '2026-01-20T00:00:00Z',
    description: 'Due date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

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
