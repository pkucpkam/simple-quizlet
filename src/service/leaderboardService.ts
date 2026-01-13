// import { collection, doc, getDoc, getDocs, setDoc, updateDoc, orderBy, query, limit, serverTimestamp } from "firebase/firestore";
// import { db } from "./firebase_setup";
// import type { UserStats, LeaderboardEntry } from "../types/leaderboard";

// export const leaderboardService = {
//     /**
//      * Get or create user stats document
//      */
//     async getUserStats(userId: string): Promise<UserStats | null> {
//         try {
//             const docRef = doc(db, "userStats", userId);
//             const docSnap = await getDoc(docRef);

//             if (docSnap.exists()) {
//                 const data = docSnap.data();
//                 return {
//                     odontId: userId,
//                     username: data.username || "Ẩn danh",
//                     totalWordsLearned: data.totalWordsLearned || 0,
//                     totalTimeSpent: data.totalTimeSpent || 0,
//                     totalSessions: data.totalSessions || 0,
//                     totalQuizScore: data.totalQuizScore || 0,
//                     quizAttempts: data.quizAttempts || 0,
//                     averageScore: data.quizAttempts > 0 ? Math.round(data.totalQuizScore / data.quizAttempts) : 0,
//                     lastActive: data.lastActive?.toDate() || new Date(),
//                 };
//             }
//             return null;
//         } catch (error) {
//             console.error("[Leaderboard] Error getting user stats:", error);
//             return null;
//         }
//     },

//     /**
//      * Initialize user stats when they first complete a session
//      */
//     async initUserStats(userId: string, username: string): Promise<void> {
//         try {
//             const docRef = doc(db, "userStats", userId);
//             const docSnap = await getDoc(docRef);

//             if (!docSnap.exists()) {
//                 await setDoc(docRef, {
//                     username,
//                     totalWordsLearned: 0,
//                     totalTimeSpent: 0,
//                     totalSessions: 0,
//                     totalQuizScore: 0,
//                     quizAttempts: 0,
//                     lastActive: serverTimestamp(),
//                 });
//                 console.log("[Leaderboard] Initialized stats for user:", userId);
//             }
//         } catch (error) {
//             console.error("[Leaderboard] Error initializing user stats:", error);
//         }
//     },

//     /**
//      * Update user stats after completing a study session
//      */
//     async updateStatsAfterStudy(
//         userId: string,
//         username: string,
//         wordsLearned: number,
//         timeSpent: number,
//         isQuiz: boolean = false,
//         quizScore: number = 0
//     ): Promise<void> {
//         try {
//             const docRef = doc(db, "userStats", userId);
//             const docSnap = await getDoc(docRef);

//             if (docSnap.exists()) {
//                 const current = docSnap.data();
//                 const updateData: any = {
//                     totalWordsLearned: (current.totalWordsLearned || 0) + wordsLearned,
//                     totalTimeSpent: (current.totalTimeSpent || 0) + timeSpent,
//                     totalSessions: (current.totalSessions || 0) + 1,
//                     lastActive: serverTimestamp(),
//                 };

//                 if (isQuiz) {
//                     updateData.totalQuizScore = (current.totalQuizScore || 0) + quizScore;
//                     updateData.quizAttempts = (current.quizAttempts || 0) + 1;
//                 }

//                 await updateDoc(docRef, updateData);
//             } else {
//                 // Create new stats document
//                 await setDoc(docRef, {
//                     username,
//                     totalWordsLearned: wordsLearned,
//                     totalTimeSpent: timeSpent,
//                     totalSessions: 1,
//                     totalQuizScore: isQuiz ? quizScore : 0,
//                     quizAttempts: isQuiz ? 1 : 0,
//                     lastActive: serverTimestamp(),
//                 });
//             }

//             console.log("[Leaderboard] Updated stats for user:", userId);
//         } catch (error) {
//             console.error("[Leaderboard] Error updating stats:", error);
//         }
//     },

//     /**
//      * Get leaderboard sorted by a specific field
//      */
//     async getLeaderboard(
//         sortBy: "totalWordsLearned" | "totalTimeSpent" | "averageScore" | "totalSessions" = "totalWordsLearned",
//         maxResults: number = 50
//     ): Promise<LeaderboardEntry[]> {
//         try {
//             // For averageScore, we need to calculate it client-side since Firestore can't sort by computed fields
//             const sortField = sortBy === "averageScore" ? "totalQuizScore" : sortBy;

//             const q = query(
//                 collection(db, "userStats"),
//                 orderBy(sortField, "desc"),
//                 limit(maxResults)
//             );

//             const querySnapshot = await getDocs(q);
//             let entries: LeaderboardEntry[] = querySnapshot.docs.map((doc, index) => {
//                 const data = doc.data();
//                 return {
//                     odontId: doc.id,
//                     username: data.username || "Ẩn danh",
//                     totalWordsLearned: data.totalWordsLearned || 0,
//                     totalTimeSpent: data.totalTimeSpent || 0,
//                     totalSessions: data.totalSessions || 0,
//                     totalQuizScore: data.totalQuizScore || 0,
//                     quizAttempts: data.quizAttempts || 0,
//                     averageScore: data.quizAttempts > 0 ? Math.round(data.totalQuizScore / data.quizAttempts) : 0,
//                     lastActive: data.lastActive?.toDate() || new Date(),
//                     rank: index + 1,
//                 };
//             });

//             // If sorting by average score, re-sort client-side
//             if (sortBy === "averageScore") {
//                 entries.sort((a, b) => b.averageScore - a.averageScore);
//                 entries = entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
//             }

//             return entries;
//         } catch (error) {
//             console.error("[Leaderboard] Error getting leaderboard:", error);
//             return [];
//         }
//     },
// };
