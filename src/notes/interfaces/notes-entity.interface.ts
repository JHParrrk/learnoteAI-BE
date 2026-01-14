export interface NotesEntity {
  id: number;
  user_id: number;
  title: string;
  raw_content: string;
  refined_content: string | null;
  created_at: string;
}
