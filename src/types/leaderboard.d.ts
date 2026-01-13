export interface UserStats {
    odontId: string;          // Firebase Auth UID
    username: string;
    totalWordsLearned: number;  // Tổng số từ đã thuộc (knowCount)
    totalTimeSpent: number;     // Tổng thời gian học (giây)
    totalSessions: number;      // Tổng số phiên học
    totalQuizScore: number;     // Tổng điểm quiz/test
    quizAttempts: number;       // Số lần làm quiz/test
    averageScore: number;       // Điểm trung bình (totalQuizScore / quizAttempts)
    lastActive: Date;           // Lần hoạt động gần nhất
}

export interface LeaderboardEntry extends UserStats {
    rank: number;
}
