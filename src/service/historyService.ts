import {
  collection,
  getDocs,
  setDoc,
  doc,
  increment,
  getDoc,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase_setup";
import type { StudyAggregateStats, ModeStats } from "../types/history";

type StudyMode = "flashcard" | "review" | "test";

/** Map các studyMode cũ → nhóm mode mới */
const toModeGroup = (mode: string): StudyMode => {
  if (mode === "flashcard") return "flashcard";
  if (mode === "test") return "test";
  // quiz, review, srs_review → review
  return "review";
};

const STATS_DOC = (userId: string) =>
  doc(db, `history/${userId}/aggregate`, "studyStats");

// ─────────────────────────────────────────────
// 1. Ghi dồn sau mỗi lần học
// ─────────────────────────────────────────────
export const historyService = {
  async incrementStudyStats(
    userId: string,
    mode: StudyMode,
    timeSpent: number
  ) {
    try {
      await setDoc(
        STATS_DOC(userId),
        {
          [mode]: {
            sessions: increment(1),
            totalTime: increment(timeSpent),
            lastStudied: serverTimestamp(),
          },
          totalSessions: increment(1),
          totalTime: increment(timeSpent),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Giữ heatmap dailyLog
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const dailyRef = doc(db, `history/${userId}/aggregate`, "dailyLog");
      await setDoc(dailyRef, { [dateString]: increment(1) }, { merge: true });
    } catch (error) {
      console.error("[History] Error incrementing study stats:", error);
    }
  },

  // ─────────────────────────────────────────────
  // 2. Đọc aggregate stats (1 document duy nhất)
  // ─────────────────────────────────────────────
  async getStudyAggregateStats(
    userId: string
  ): Promise<StudyAggregateStats | null> {
    try {
      const snap = await getDoc(STATS_DOC(userId));
      if (!snap.exists()) return null;
      const d = snap.data();

      const parseMode = (raw: Record<string, unknown> | undefined): ModeStats => ({
        sessions: (raw?.sessions as number) || 0,
        totalTime: (raw?.totalTime as number) || 0,
        lastStudied: raw?.lastStudied
          ? (raw.lastStudied as Timestamp).toDate?.()
          : undefined,
      });

      return {
        flashcard: parseMode(d.flashcard),
        review: parseMode(d.review),
        test: parseMode(d.test),
        totalTime: (d.totalTime as number) || 0,
        totalSessions: (d.totalSessions as number) || 0,
        migrated: (d.migrated as boolean) || false,
        updatedAt: d.updatedAt
          ? (d.updatedAt as Timestamp).toDate?.()
          : undefined,
      };
    } catch (error) {
      console.error("[History] Error fetching aggregate stats:", error);
      return null;
    }
  },

  // ─────────────────────────────────────────────
  // 3. Migration: tổng hợp sessions cũ → aggregate → xóa sessions
  // ─────────────────────────────────────────────
  async migrateUserHistory(userId: string): Promise<void> {
    try {
      // Kiểm tra đã migrate chưa
      const statsSnap = await getDoc(STATS_DOC(userId));
      if (statsSnap.exists() && statsSnap.data()?.migrated === true) return;

      // Đọc toàn bộ sessions cũ
      const sessionsRef = collection(db, `history/${userId}/sessions`);
      const snapshot = await getDocs(sessionsRef);

      if (snapshot.empty) {
        // Không có sessions cũ → chỉ set migrated flag
        await setDoc(STATS_DOC(userId), { migrated: true }, { merge: true });
        return;
      }

      // Tổng hợp
      const acc: Record<StudyMode, ModeStats & { latestMs: number }> = {
        flashcard: { sessions: 0, totalTime: 0, latestMs: 0 },
        review: { sessions: 0, totalTime: 0, latestMs: 0 },
        test: { sessions: 0, totalTime: 0, latestMs: 0 },
      };
      let totalTime = 0;
      let totalSessions = 0;

      snapshot.docs.forEach((d) => {
        const data = d.data();
        const group = toModeGroup(data.studyMode || "review");
        const time = (data.timeSpent as number) || 0;
        const ts: Timestamp | undefined = data.studyTime;
        const ms = ts?.toMillis?.() ?? 0;

        acc[group].sessions += 1;
        acc[group].totalTime += time;
        if (ms > acc[group].latestMs) {
          acc[group].latestMs = ms;
          acc[group].lastStudied = ts?.toDate?.();
        }
        totalTime += time;
        totalSessions += 1;
      });

      // Ghi aggregate document
      await setDoc(STATS_DOC(userId), {
        flashcard: {
          sessions: acc.flashcard.sessions,
          totalTime: acc.flashcard.totalTime,
          lastStudied: acc.flashcard.lastStudied
            ? Timestamp.fromDate(acc.flashcard.lastStudied)
            : null,
        },
        review: {
          sessions: acc.review.sessions,
          totalTime: acc.review.totalTime,
          lastStudied: acc.review.lastStudied
            ? Timestamp.fromDate(acc.review.lastStudied)
            : null,
        },
        test: {
          sessions: acc.test.sessions,
          totalTime: acc.test.totalTime,
          lastStudied: acc.test.lastStudied
            ? Timestamp.fromDate(acc.test.lastStudied)
            : null,
        },
        totalTime,
        totalSessions,
        migrated: true,
        updatedAt: serverTimestamp(),
      });

      // Batch delete sessions cũ (max 500/batch)
      const allDocs = snapshot.docs;
      for (let i = 0; i < allDocs.length; i += 500) {
        const batch = writeBatch(db);
        allDocs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }

      console.log(
        `[History] Migrated ${totalSessions} sessions for user ${userId}`
      );
    } catch (error) {
      console.error("[History] Migration error:", error);
    }
  },

  // ─────────────────────────────────────────────
  // 4. Heatmap daily activity (giữ nguyên)
  // ─────────────────────────────────────────────
  async getUserDailyActivity(
    userId: string
  ): Promise<Record<string, number>> {
    try {
      const dailyRef = doc(db, `history/${userId}/aggregate`, "dailyLog");
      const docSnap = await getDoc(dailyRef);
      if (docSnap.exists()) return docSnap.data() as Record<string, number>;
      return {};
    } catch (error) {
      console.error("[History] Error fetching daily activity:", error);
      return {};
    }
  },

  // ─────────────────────────────────────────────
  // Legacy – kept for backward compat, delegates to increment
  // ─────────────────────────────────────────────
  async saveStudySession(
    userId: string,
    sessionData: {
      timeSpent: number;
      studyMode: string;
      // các trường cũ giữ signature nhưng bỏ qua
      setId?: string;
      setName?: string;
      lessonId?: string;
      lessonTitle?: string;
      knowCount?: number;
      totalCount?: number;
    }
  ) {
    return this.incrementStudyStats(
      userId,
      toModeGroup(sessionData.studyMode),
      sessionData.timeSpent || 0
    );
  },
};