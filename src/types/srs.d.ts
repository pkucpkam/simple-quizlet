// Spaced Repetition System Types

export type ReviewRating = "again" | "hard" | "good" | "easy";

export interface SRSCard {
    id?: string; // Firestore document ID
    wordId: string; // Reference to vocabulary word
    word: string;
    definition: string;

    // SRS Algorithm fields (SM-2 based)
    easeFactor: number; // 1.3 - 2.5, default 2.5
    interval: number; // Days until next review
    repetitions: number; // Number of successful reviews
    nextReview: Date; // Next review date
    lastReview?: Date; // Last review date

    // Statistics
    totalReviews: number; // Total number of reviews
    correctCount: number; // Number of correct reviews
    incorrectCount: number; // Number of incorrect reviews
    streak: number; // Current correct streak

    // Metadata
    lessonId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ReviewSession {
    id: string;
    userId: string;
    lessonId?: string;
    startTime: Date;
    endTime?: Date;
    cardsReviewed: number;
    correctCount: number;
    incorrectCount: number;
    totalTime: number; // in seconds
    averageTime: number; // average time per card
}

export interface DailyStats {
    date: Date;
    userId: string;
    newCards: number;
    reviewedCards: number;
    correctCount: number;
    incorrectCount: number;
    timeSpent: number; // in seconds
    streak: number;
}

export interface UserProgress {
    userId: string;
    totalCards: number;
    newCards: number; // Cards never reviewed
    learningCards: number; // Cards in learning phase (interval < 21 days)
    masteredCards: number; // Cards mastered (interval >= 21 days)
    dueToday: number;
    currentStreak: number;
    longestStreak: number;
    totalReviews: number;
    accuracy: number; // percentage
    lastStudyDate?: Date;
}
