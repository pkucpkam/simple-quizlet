import { collection, getDocs, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase_setup";
import type { StudySession, StudyStats } from "../types/history";

export const historyService = {
  async saveStudySession(
    userId: string,
    sessionData: Omit<StudySession, "id">
  ) {
    try {
      const ref = collection(db, `history/${userId}/sessions`);
      const docRef = await addDoc(ref, {
        ...sessionData,
        studyTime: serverTimestamp(), 
      });
      console.log("[History] Saved new study session:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("[History] Error saving study session:", error);
    }
  },


  async getUserStudyHistory(userId: string): Promise<StudySession[]> {
    try {
      const q = query(
        collection(db, `history/${userId}/sessions`),
        orderBy("studyTime", "desc")
      );
      const querySnapshot = await getDocs(q);
      const sessions: StudySession[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        userId,
        setId: doc.data().setId || "",
        setName: doc.data().setName || "",
        lessonId: doc.data().lessonId || "",
        lessonTitle: doc.data().lessonTitle || "",
        studyTime: doc.data().studyTime?.toDate?.() || new Date(),
        score: doc.data().score || 0,
        studyMode: doc.data().studyMode || "",
        timeSpent: doc.data().timeSpent || 0,
        totalQuestions: doc.data().totalQuestions ?? 0,
        correctAnswers: doc.data().correctAnswers ?? 0,
        completedAt: doc.data().completedAt?.toDate?.() || null,
        difficulty: doc.data().difficulty || "",
        knowCount: doc.data().knowCount || 0,
        stillLearningCount: doc.data().stillLearningCount || 0,
      }));
      console.log("[History] Fetched sessions:", sessions);
      return sessions;
    } catch (error) {
      console.error("[History] Error fetching user history:", error);
      return [];
    }
  },

  getStudyStats(sessions: StudySession[]): StudyStats {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        favoriteMode: "",
        totalSetsStudied: 0,
      };
    }

    const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
    const averageScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length;
    const uniqueSets = new Set(sessions.map((s) => s.setId)).size;

    const modes = sessions.reduce((acc, s) => {
      acc[s.studyMode] = (acc[s.studyMode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const favoriteMode = Object.keys(modes).reduce((a, b) => (modes[a] > modes[b] ? a : b), "");

    return {
      totalSessions: sessions.length,
      totalTimeSpent,
      averageScore,
      favoriteMode,
      totalSetsStudied: uniqueSets,
    };
  },
};
