import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    writeBatch,
    increment,
} from "firebase/firestore";
import { db } from "./firebase_setup";
import type { SRSCard, ReviewRating, ReviewSession } from "../types/srs";
import {
    calculateNextReview,
    getDueCards,
    initializeSRSCard,
} from "../utils/srsAlgorithm";

export const srsService = {
    /**
     * Initialize SRS cards for a lesson
     */
    async initializeCardsForLesson(
        lessonId: string,
        userId: string,
        vocabulary: Array<{ word: string; definition: string }>
    ): Promise<void> {
        try {
            const batch = writeBatch(db);
            const cardsRef = collection(db, "srsCards");

            // Check if cards already exist for this lesson
            const existingQuery = query(
                cardsRef,
                where("lessonId", "==", lessonId),
                where("userId", "==", userId)
            );
            const existingCards = await getDocs(existingQuery);

            if (existingCards.size > 0) {
                return;
            }

            // Create SRS cards for each word
            vocabulary.forEach((vocab) => {
                const cardData = initializeSRSCard(
                    `${lessonId}_${vocab.word}`,
                    vocab.word,
                    vocab.definition,
                    lessonId,
                    userId
                );

                const newCardRef = doc(cardsRef);
                batch.set(newCardRef, {
                    ...cardData,
                    createdAt: Timestamp.fromDate(cardData.createdAt),
                    updatedAt: Timestamp.fromDate(cardData.updatedAt),
                    nextReview: Timestamp.fromDate(cardData.nextReview),
                });
            });

            await batch.commit();
        } catch (error) {
            console.error("Error initializing SRS cards:", error);
            throw new Error("Không thể khởi tạo thẻ học. Vui lòng thử lại.");
        }
    },

    /**
     * Get all SRS cards for a user
     */
    async getUserCards(userId: string): Promise<SRSCard[]> {
        try {
            const q = query(
                collection(db, "srsCards"),
                where("userId", "==", userId),
                orderBy("nextReview", "asc")
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    nextReview: data.nextReview.toDate(),
                    lastReview: data.lastReview?.toDate(),
                    createdAt: data.createdAt.toDate(),
                    updatedAt: data.updatedAt.toDate(),
                } as SRSCard;
            });
        } catch (error) {
            console.error("Error getting user cards:", error);
            throw new Error("Không thể tải thẻ học.");
        }
    },

    /**
     * Get cards due for review today
     */
    async getDueCardsForUser(userId: string): Promise<SRSCard[]> {
        try {
            const allCards = await this.getUserCards(userId);
            return getDueCards(allCards);
        } catch (error) {
            console.error("Error getting due cards:", error);
            throw new Error("Không thể tải thẻ cần ôn.");
        }
    },

    /**
     * Get cards for a specific lesson
     */
    async getCardsForLesson(lessonId: string, userId: string): Promise<SRSCard[]> {
        try {
            const q = query(
                collection(db, "srsCards"),
                where("lessonId", "==", lessonId),
                where("userId", "==", userId)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    nextReview: data.nextReview.toDate(),
                    lastReview: data.lastReview?.toDate(),
                    createdAt: data.createdAt.toDate(),
                    updatedAt: data.updatedAt.toDate(),
                } as SRSCard;
            });
        } catch (error) {
            console.error("Error getting lesson cards:", error);
            throw new Error("Không thể tải thẻ bài học.");
        }
    },

    /**
     * Review a card and update its SRS data
     */
    async reviewCard(cardId: string, rating: ReviewRating): Promise<SRSCard> {
        try {
            const cardRef = doc(db, "srsCards", cardId);
            const cardSnap = await getDoc(cardRef);

            if (!cardSnap.exists()) {
                throw new Error("Card not found");
            }

            const currentCard = {
                id: cardSnap.id,
                ...cardSnap.data(),
                nextReview: cardSnap.data().nextReview.toDate(),
                lastReview: cardSnap.data().lastReview?.toDate(),
                createdAt: cardSnap.data().createdAt.toDate(),
                updatedAt: cardSnap.data().updatedAt.toDate(),
            } as SRSCard;

            // Calculate new SRS values
            const updates = calculateNextReview(currentCard, rating);

            // Update statistics
            const isCorrect = rating !== "again";
            const newStreak = isCorrect ? currentCard.streak + 1 : 0;

            const updateData = {
                ...updates,
                nextReview: Timestamp.fromDate(updates.nextReview!),
                lastReview: Timestamp.fromDate(updates.lastReview!),
                updatedAt: Timestamp.fromDate(updates.updatedAt!),
                totalReviews: increment(1),
                correctCount: increment(isCorrect ? 1 : 0),
                incorrectCount: increment(isCorrect ? 0 : 1),
                streak: newStreak,
            };

            await updateDoc(cardRef, updateData);

            // Return updated card
            const updatedSnap = await getDoc(cardRef);
            const updatedData = updatedSnap.data()!;
            return {
                id: updatedSnap.id,
                ...updatedData,
                nextReview: updatedData.nextReview.toDate(),
                lastReview: updatedData.lastReview?.toDate(),
                createdAt: updatedData.createdAt.toDate(),
                updatedAt: updatedData.updatedAt.toDate(),
            } as SRSCard;
        } catch (error) {
            console.error("Error reviewing card:", error);
            throw new Error("Không thể cập nhật thẻ học.");
        }
    },

    /**
     * Start a review session
     */
    async startReviewSession(userId: string, lessonId?: string): Promise<string> {
        try {
            const sessionData: Omit<ReviewSession, "id"> = {
                userId,
                lessonId,
                startTime: new Date(),
                cardsReviewed: 0,
                correctCount: 0,
                incorrectCount: 0,
                totalTime: 0,
                averageTime: 0,
            };

            const sessionRef = await addDoc(collection(db, "reviewSessions"), {
                ...sessionData,
                startTime: Timestamp.fromDate(sessionData.startTime),
            });

            return sessionRef.id;
        } catch (error) {
            console.error("Error starting review session:", error);
            throw new Error("Không thể bắt đầu phiên ôn tập.");
        }
    },

    /**
     * End a review session
     */
    async endReviewSession(
        sessionId: string,
        stats: {
            cardsReviewed: number;
            correctCount: number;
            incorrectCount: number;
            totalTime: number;
        }
    ): Promise<void> {
        try {
            const sessionRef = doc(db, "reviewSessions", sessionId);
            await updateDoc(sessionRef, {
                endTime: Timestamp.now(),
                cardsReviewed: stats.cardsReviewed,
                correctCount: stats.correctCount,
                incorrectCount: stats.incorrectCount,
                totalTime: stats.totalTime,
                averageTime: stats.cardsReviewed > 0 ? stats.totalTime / stats.cardsReviewed : 0,
            });
        } catch (error) {
            console.error("Error ending review session:", error);
        }
    },
};
