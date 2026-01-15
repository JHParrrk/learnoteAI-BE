export interface NoteAnalysisResponse {
  noteId: number;
  title?: string;
  status: 'ANALYZING' | 'COMPLETED';
  message?: string;
  rawContent?: string | null;
  refinedNote?: string | null;
  summary?: Record<string, any>;
  factChecks?: any[];
  feedback?: Record<string, any>;
  skillUpdateProposal?: Record<string, any>;
  suggestedTodos?: any[];
}
