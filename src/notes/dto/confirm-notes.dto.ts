import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptedTodoDto {
  @ApiProperty({
    example: 'Review React Hooks',
    description: 'The content of the todo item',
  })
  @IsString()
  content: string;

  @ApiProperty({
    example: '2026-01-20',
    description: 'The due date for the todo',
    required: false,
    nullable: true,
  })
  @IsOptional() // Allow null or undefined
  @IsString()
  dueDate?: string | null;
}

export class ConfirmNoteDto {
  @ApiProperty({
    example: 'This is the final refined version of the note content.',
    description: 'The final content after user review',
  })
  @IsString()
  finalRefinedContent: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user confirmed the extracted skills',
  })
  @IsBoolean()
  confirmSkills: boolean;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'List of checked fact check IDs',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  checkedFactChecks: number[];

  @ApiProperty({
    type: [AcceptedTodoDto],
    description: 'List of todos accepted by the user',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcceptedTodoDto)
  acceptedTodos: AcceptedTodoDto[];
}
