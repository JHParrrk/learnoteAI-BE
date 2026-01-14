import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({
    example: 'Study Session: NestJS',
    description: 'The title of the note',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'This is the raw content of the note.',
    description: 'The main content of the note',
  })
  @IsString()
  @IsNotEmpty()
  rawContent: string;

  @ApiProperty({
    example: '2026-01-14T10:00:00Z',
    description: 'The date and time of the note',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  date?: string;
}
