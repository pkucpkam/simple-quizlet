export interface Lesson {
  id: string;
  title: string;
  creator: string;
  vocabId: string;
  createdAt: Date;
  description: string;
  wordCount: number;
  isPrivate: boolean;
  folderId?: string | null;
}
