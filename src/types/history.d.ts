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
  popularMode: string;
  totalSetsStudied: number;
  flashcardStats: {
    sessions: number;
    timeSpent: number;
  };
  reviewStats: {
    sessions: number;
    timeSpent: number;
  };
  testStats: {
    sessions: number;
    timeSpent: number;
  };
}