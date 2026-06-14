import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase_setup";
import { historyService } from "./historyService";

export interface LeaderboardEntry {
  userId: string;
  username: string;
  photoURL?: string;
  totalTimeSpent: number;
  flashcardTime: number;
  reviewTime: number;
  testTime: number;
}

export const leaderboardService = {
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const entries: LeaderboardEntry[] = [];

      // Dùng Promise.all để fetch song song lịch sử của tất cả user, tăng tốc độ
      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const username = userDoc.data().username || "Người dùng ẩn danh";
        const photoURL = userDoc.data().photoURL || null;
        
        const stats = await historyService.getStudyAggregateStats(userId);
        if (stats && stats.totalTime > 0) {
          return {
            userId,
            username,
            photoURL,
            totalTimeSpent: stats.totalTime,
            flashcardTime: stats.flashcard?.totalTime || 0,
            reviewTime: stats.review?.totalTime || 0,
            testTime: stats.test?.totalTime || 0,
          } as LeaderboardEntry;
        }
        return null;
      });

      const results = await Promise.all(promises);
      
      results.forEach(res => {
        if (res) entries.push(res);
      });

      // Sắp xếp theo tổng thời gian giảm dần
      return entries.sort((a, b) => b.totalTimeSpent - a.totalTimeSpent);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu bảng xếp hạng:", error);
      return [];
    }
  }
};
