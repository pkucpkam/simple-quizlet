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
        
        const history = await historyService.getUserStudyHistory(userId);
        if (history.length > 0) {
          const stats = historyService.getStudyStats(history);
          return {
            userId,
            username,
            photoURL,
            totalTimeSpent: stats.totalTimeSpent,
            flashcardTime: stats.flashcardStats?.timeSpent || 0,
            reviewTime: stats.reviewStats?.timeSpent || 0,
            testTime: stats.testStats?.timeSpent || 0,
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
