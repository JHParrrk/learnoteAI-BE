import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({
    example: 'Updated Note Title',
    description: 'The updated title of the note',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'This is the updated refined content of the note.',
    description: 'The updated refined content of the note',
  })
  @IsString()
  @IsOptional()
  refinedContent?: string;
}
