import { DeadlineType } from '../../dashboard/interfaces/deadline-type.enum';
export * from './user.entity';

export interface Note {
  id: number;
  userId: number;
  title: string;
  rawContent: string;
  refinedContent?: string;
  createdAt: string;
}

export interface NoteAnalysis {
  id: number;
  noteId: number;
  summaryJson: any;
  skillProposalJson: any;
  feedbackJson: any;
  suggestedTodosJson: any;
  analyzedAt: string;
}

export interface FactCheck {
  id: number;
  noteId: number;
  originalText: string;
  verdict: 'TRUE' | 'FALSE' | 'PARTIALLY_TRUE';
  correction?: string;
  isUserChecked: boolean;
}

export interface SkillNode {
  id: number;
  userId: number;
  parentId?: number;
  name: string;
  level: number;
  sourceNoteId?: number;
}

export interface LearningTodo {
  id: number;
  noteId: number;
  content: string;
  dueDate?: string;
  status: 'PENDING' | 'COMPLETED';
  reason?: string;
  deadlineType?: DeadlineType;
}
