export interface StudySession {
  id: string;
  userId: string;
  setId: string;
  setName: string;
  lessonId: string;
  lessonTitle: string;
  studyTime: Date;
  timeSpent: number;
  knowCount: number;
  studyMode: string;
}

export interface StudyStats {
  totalSessions: number;
  totalTimeSpent: number;
  favoriteMode: string;
  totalSetsStudied: number;
}