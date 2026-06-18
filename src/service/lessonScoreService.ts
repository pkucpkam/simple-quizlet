import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase_setup";

export interface LessonScore {
  userId: string;
  lessonId: string;
  lessonTitle: string;
  points: number;
  updatedAt: Date;
  effectivePoints?: number; // Calculated field for UI
}

export const lessonScoreService = {
  /**
   * Calculates effective points based on elapsed time
   * Formula: current points - (days passed since last update)
   */
  calculateEffectivePoints(points: number, updatedAt: Date): number {
    const now = new Date();
    const timeDiff = now.getTime() - updatedAt.getTime();
    const daysPassed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Decrease 1 point per day, but allow it to drop to negative so users know it's neglected.
    // Or cap at 0 if we want. Let's allow negative/0.
    return points - daysPassed;
  },

  /**
   * Increment the score of a lesson by 1 after testing
   */
  async incrementScore(userId: string, lessonId: string, lessonTitle: string): Promise<void> {
    try {
      const docId = `${userId}_${lessonId}`;
      const scoreRef = doc(db, "lessonScores", docId);
      const scoreSnap = await getDoc(scoreRef);

      const now = new Date();
      let newPoints = 1;

      if (scoreSnap.exists()) {
        const data = scoreSnap.data();
        const currentPoints = data.points || 0;
        const updatedAt = data.updatedAt?.toDate() || new Date();
        
        // Calculate the decayed points first, then add 1
        const effective = this.calculateEffectivePoints(currentPoints, updatedAt);
        newPoints = effective + 1;
      }

      await setDoc(scoreRef, {
        userId,
        lessonId,
        lessonTitle,
        points: newPoints,
        updatedAt: now,
      }, { merge: true });
    } catch (error) {
      console.error("Error incrementing lesson score:", error);
    }
  },

  /**
   * Get all tracked lessons for a user and calculate their current effective scores
   */
  async getUserScores(userId: string): Promise<LessonScore[]> {
    try {
      const q = query(
        collection(db, "lessonScores"),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      const scores: LessonScore[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const points = data.points || 0;
        const updatedAt = data.updatedAt?.toDate() || new Date();
        const effectivePoints = this.calculateEffectivePoints(points, updatedAt);

        scores.push({
          userId: data.userId,
          lessonId: data.lessonId,
          lessonTitle: data.lessonTitle,
          points,
          updatedAt,
          effectivePoints,
        });
      });

      // Sort ascending (lowest scores first) so users prioritize lessons they haven't tested in a while
      scores.sort((a, b) => (a.effectivePoints || 0) - (b.effectivePoints || 0));

      return scores;
    } catch (error) {
      console.error("Error fetching user lesson scores:", error);
      return [];
    }
  }
};
