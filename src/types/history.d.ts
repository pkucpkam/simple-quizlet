export interface ModeStats {
  sessions: number;
  totalTime: number; // seconds
  lastStudied?: Date;
}

export interface StudyAggregateStats {
  flashcard: ModeStats;
  review: ModeStats;
  test: ModeStats;
  totalTime: number;
  totalSessions: number;
  migrated?: boolean;
  updatedAt?: Date;
}