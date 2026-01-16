import { ApiProperty } from '@nestjs/swagger';
import { DeadlineType } from '../interfaces/deadline-type.enum';

export class TodoResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: 10,
    description: 'ID of the related note',
    nullable: true,
  })
  noteId: number | null;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'Review React Hooks' })
  content: string;

  @ApiProperty({ example: '2026-01-20', nullable: true })
  dueDate: string | null;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'COMPLETED'] })
  status: 'PENDING' | 'COMPLETED';

  @ApiProperty({ example: 'Essential for state management', nullable: true })
  reason: string | null;

  @ApiProperty({
    enum: DeadlineType,
    example: DeadlineType.SHORT_TERM,
    description: 'Deadline type (SHORT_TERM or LONG_TERM)',
    nullable: true,
  })
  deadlineType: DeadlineType | null;

  @ApiProperty({ example: '2026-01-14T12:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: true })
  isChecked: boolean;
}
