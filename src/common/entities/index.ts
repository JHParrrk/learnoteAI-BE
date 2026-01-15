import { DeadlineType } from '../../dashboard/interfaces/deadline-type.enum';
export * from './user.entity';

export interface Note {
  id: number;
  user_id: number;
  title: string;
  raw_content: string;
  refined_content?: string;
  created_at: string;
}

export interface NoteAnalysis {
  id: number;
  note_id: number;
  summary_json: any;
  skill_proposal_json: any;
  feedback_json: any;
  suggested_todos_json: any;
  analyzed_at: string;
}

export interface FactCheck {
  id: number;
  note_id: number;
  original_text: string;
  verdict: 'TRUE' | 'FALSE' | 'PARTIALLY_TRUE';
  correction?: string;
  is_user_checked: boolean;
}

export interface SkillNode {
  id: number;
  user_id: number;
  parent_id?: number;
  name: string;
  level: number;
  source_note_id?: number;
}

export interface LearningTodo {
  id: number;
  note_id: number;
  content: string;
  due_date?: string;
  status: 'PENDING' | 'COMPLETED';
  reason?: string;
  deadline_type?: DeadlineType;
}
