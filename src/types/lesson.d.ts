export interface Lesson {
  vocabId: string;
  creator: ReactNode;
  id: string;
  title: string;
  description: string;
  wordCount: number;
  isPrivate: boolean;
  folderId?: string | null; // ID của thư mục chứa bài học (optional)
}
