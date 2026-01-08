import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AcceptedTodoDto {
  @IsString()
  content: string;

  @IsOptional() // Allow null or undefined
  @IsString()
  dueDate?: string | null;
}

export class ConfirmNoteDto {
  @IsString()
  finalRefinedContent: string;

  @IsBoolean()
  confirmSkills: boolean;

  @IsArray()
  @IsNumber({}, { each: true })
  checkedFactChecks: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcceptedTodoDto)
  acceptedTodos: AcceptedTodoDto[];
}
