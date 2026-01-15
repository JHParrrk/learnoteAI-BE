import { ApiProperty } from '@nestjs/swagger';

export class NoteCreateResponseDto {
  @ApiProperty({ example: 1 })
  noteId: number;

  @ApiProperty({ example: 'ANALYZING' })
  status: string;

  @ApiProperty({
    example: 'Note creation started and analysis is in progress.',
  })
  message: string;

  @ApiProperty({ example: 'Raw content of the note...' })
  rawContent: string;
}

export class NoteAnalysisResponseDto {
  @ApiProperty({ example: 1 })
  noteId: number;

  @ApiProperty({ example: 'Study Session: NestJS', required: false })
  title?: string;

  @ApiProperty({ example: 'COMPLETED', enum: ['ANALYZING', 'COMPLETED'] })
  status: 'ANALYZING' | 'COMPLETED';

  @ApiProperty({ example: 'Analysis complete.' })
  message?: string;

  @ApiProperty({ example: 'Raw content of the note...' })
  rawContent?: string | null;

  @ApiProperty({ example: 'Refined content of the note...', nullable: true })
  refinedNote?: string | null;

  @ApiProperty({
    example: { 'key concepts': ['NestJS', 'Swagger'] },
    description: 'Summary of the note',
  })
  summary?: Record<string, any>;

  @ApiProperty({
    example: [
      {
        id: 1,
        fact: 'NestJS is a Node.js framework.',
        verified: true,
      },
    ],
    description: 'List of fact checks',
  })
  factChecks?: any[];

  @ApiProperty({
    example: { suggestions: 'Add more examples.' },
    description: 'Feedback on the note',
  })
  feedback?: Record<string, any>;

  @ApiProperty({
    example: { skills: ['Typescript', 'Backend'] },
    description: 'Proposed skill updates',
  })
  skillUpdateProposal?: Record<string, any>;

  @ApiProperty({
    example: [{ content: 'Practice Decorators', dueDate: '2026-01-15' }],
    description: 'Suggested todo items',
  })
  suggestedTodos?: any[];
}

export class NoteEntityDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'Study Session: NestJS' })
  title: string;

  @ApiProperty({ example: 'Raw content...' })
  rawContent: string;

  @ApiProperty({ example: 'Refined content...', nullable: true })
  refinedContent: string | null;

  @ApiProperty({ example: '2026-01-14T10:00:00Z' })
  createdAt: string;
}

export class SimpleMessageResponseDto {
  @ApiProperty({ example: 'Operation successful' })
  message: string;
}
