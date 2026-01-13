import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteDto {
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

  @IsDateString()
  @IsOptional()
  date?: string;
}
