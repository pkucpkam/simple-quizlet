import { collection, getDocs, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase_setup";
import type { StudySession, StudyStats } from "../types/history";

export const historyService = {
  async saveStudySession(
    userId: string,
    sessionData: Pick<StudySession, "setId" | "setName" | "lessonId" | "lessonTitle" | "timeSpent" | "knowCount" | "studyMode">
  ) {
    try {
      console.log("[HistoryService] Saving data to Firestore:", {
        userId,
        setId: sessionData.setId,
        setName: sessionData.setName,
        lessonId: sessionData.lessonId,
        lessonTitle: sessionData.lessonTitle,
        timeSpent: sessionData.timeSpent,
        knowCount: sessionData.knowCount,
        studyMode: sessionData.studyMode,
        studyTime: serverTimestamp(),
      });

      const ref = collection(db, `history/${userId}/sessions`);
      const docRef = await addDoc(ref, {
        setId: sessionData.setId || "",
        setName: sessionData.setName || "",
        lessonId: sessionData.lessonId || "",
        lessonTitle: sessionData.lessonTitle || "",
        timeSpent: sessionData.timeSpent || 0,
        knowCount: sessionData.knowCount || 0,
        studyMode: sessionData.studyMode || "flashcard",
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
        timeSpent: doc.data().timeSpent || 0,
        knowCount: doc.data().knowCount || 0,
        studyMode: doc.data().studyMode || "flashcard",
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
        favoriteMode: "",
        totalSetsStudied: 0,
      };
    }

    const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
    const uniqueSets = new Set(sessions.map((s) => s.setId)).size;
    const modes = sessions.reduce((acc, s) => {
      acc[s.studyMode] = (acc[s.studyMode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const favoriteMode = Object.keys(modes).reduce((a, b) => (modes[a] > modes[b] ? a : b), "");

    return {
      totalSessions: sessions.length,
      totalTimeSpent,
      favoriteMode,
      totalSetsStudied: uniqueSets,
    };
  },
};