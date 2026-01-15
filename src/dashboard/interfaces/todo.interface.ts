import { DeadlineType } from './deadline-type.enum';
export { DeadlineType };

export interface LearningTodo {
  id: number;
  noteId: number | null;
  userId: number;
  content: string;
  dueDate: string | null;
  status: 'PENDING' | 'COMPLETED';
  reason: string | null;
  deadlineType: DeadlineType | null;
  createdAt: string;
}
