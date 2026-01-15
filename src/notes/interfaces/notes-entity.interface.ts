export interface NotesEntity {
  id: number;
  userId: number;
  title: string;
  rawContent: string;
  refinedContent: string | null;
  createdAt: string;
}
