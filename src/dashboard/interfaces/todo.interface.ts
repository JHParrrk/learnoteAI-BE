import { DeadlineType } from './deadline-type.enum';
export { DeadlineType };

export interface LearningTodo {
  id: number;
  note_id: number | null;
  user_id: number;
  content: string;
  due_date: string | null;
  status: 'PENDING' | 'COMPLETED';
  reason: string | null;
  deadline_type: DeadlineType | null;
  created_at: string;
}
