// SM-2 Algorithm Implementation for Spaced Repetition
// Based on SuperMemo 2 algorithm

import type { SRSCard, ReviewRating } from "../types/srs";

/**
 * Calculate next review interval using SM-2 algorithm
 * @param card - Current SRS card
 * @param rating - User's rating (again, hard, good, easy)
 * @returns Updated card with new interval and ease factor
 */
export function calculateNextReview(
    card: SRSCard,
    rating: ReviewRating
): Partial<SRSCard> {
    let { easeFactor, interval, repetitions } = card;
    const now = new Date();

    // Rating to quality mapping (SM-2 uses 0-5 scale)
    const qualityMap: Record<ReviewRating, number> = {
        again: 0, // Complete blackout
        hard: 3, // Correct response recalled with serious difficulty
        good: 4, // Correct response after hesitation
        easy: 5, // Perfect response
    };

    const quality = qualityMap[rating];

    // Update ease factor (only for quality >= 3)
    if (quality >= 3) {
        easeFactor = Math.max(
            1.3,
            easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        );
    }

    // Calculate new interval
    if (quality < 3) {
        // Failed review - reset
        repetitions = 0;
        interval = 1;
    } else {
        // Successful review
        repetitions += 1;

        if (repetitions === 1) {
            interval = 1;
        } else if (repetitions === 2) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }

        // Apply rating modifiers
        if (rating === "hard") {
            interval = Math.round(interval * 0.8); // 20% shorter
        } else if (rating === "easy") {
            interval = Math.round(interval * 1.3); // 30% longer
        }
    }

    // Calculate next review date
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + interval);

    return {
        easeFactor,
        interval,
        repetitions,
        nextReview,
        lastReview: now,
        updatedAt: now,
    };
}

/**
 * Check if a card is due for review
 */
export function isDue(card: SRSCard): boolean {
    const now = new Date();
    return card.nextReview <= now;
}

/**
 * Get cards due for review today
 */
export function getDueCards(cards: SRSCard[]): SRSCard[] {
    return cards.filter(isDue).sort((a, b) => {
        // Sort by next review date (earliest first)
        return a.nextReview.getTime() - b.nextReview.getTime();
    });
}

/**
 * Categorize card based on interval
 */
export function getCardStatus(
    card: SRSCard
): "new" | "learning" | "mastered" {
    if (card.totalReviews === 0) return "new";
    if (card.interval < 21) return "learning";
    return "mastered";
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(card: SRSCard): number {
    if (card.totalReviews === 0) return 0;
    return Math.round((card.correctCount / card.totalReviews) * 100);
}

/**
 * Get suggested daily new cards limit
 * Based on current workload
 */
export function getSuggestedNewCardsLimit(
    dueCards: number
): number {
    // If user has many due cards, suggest fewer new cards
    if (dueCards > 50) return 5;
    if (dueCards > 30) return 10;
    if (dueCards > 20) return 15;
    return 20; // Default
}

/**
 * Initialize a new SRS card from vocabulary
 */
export function initializeSRSCard(
    wordId: string,
    word: string,
    definition: string,
    lessonId: string,
    userId: string
): Omit<SRSCard, "id"> {
    const now = new Date();

    return {
        wordId,
        word,
        definition,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: now, // Due immediately for first review
        totalReviews: 0,
        correctCount: 0,
        incorrectCount: 0,
        streak: 0,
        lessonId,
        userId,
        createdAt: now,
        updatedAt: now,
    };
}
