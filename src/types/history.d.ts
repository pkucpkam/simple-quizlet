export interface StudySession {
  id: string;
  userId: string;
  setId: string;
  setName: string;
  
  lessonId?: string;         // thêm để lưu ID bài học
  lessonTitle?: string;      // thêm để lưu tiêu đề bài học
  
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  knowCount?: number;        // số thẻ đã thuộc
  stillLearningCount?: number; // số thẻ chưa thuộc
  
  timeSpent: number; 
  studyMode: 'flashcard' | 'quiz' | 'test';
  completedAt: Date;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface StudyStats {
  totalSessions: number;
  totalTimeSpent: number;
  averageScore: number;
  favoriteMode: string;
  totalSetsStudied: number;
}