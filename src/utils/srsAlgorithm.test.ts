import { describe, it, expect } from "vitest";
import { calculateNextReview, initializeSRSCard } from "./srsAlgorithm";
import type { SRSCard } from "../types/srs";

// Helper: build a minimal SRSCard for testing
function makeCard(overrides: Partial<SRSCard> = {}): SRSCard {
    return {
        id: "test-card",
        wordId: "w1",
        word: "apple",
        definition: "quả táo",
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReview: new Date(),
        totalReviews: 0,
        correctCount: 0,
        incorrectCount: 0,
        streak: 0,
        lessonId: "lesson1",
        userId: "user1",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

// ─── EF formula helper (mirrors srsAlgorithm.ts) ──────────────────────────
function computeNewEF(oldEF: number, quality: number): number {
    const raw = oldEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    return Math.min(2.8, Math.max(1.3, raw));
}

describe("calculateNextReview – SM-2 algorithm", () => {

    // ── Case 1: quality=0 (again) ────────────────────────────────────────
    describe("quality = 0 (again)", () => {
        it("resets interval to 1 and repetitions to 0", () => {
            const card = makeCard({ repetitions: 3, interval: 15, easeFactor: 2.5 });
            const result = calculateNextReview(card, "again");
            expect(result.interval).toBe(1);
            expect(result.repetitions).toBe(0);
        });

        it("decreases EF below the initial 2.5", () => {
            const card = makeCard({ easeFactor: 2.5 });
            const result = calculateNextReview(card, "again");
            // quality=0 → delta = 0.1 - 5*(0.08+5*0.02) = 0.1 - 5*0.18 = 0.1-0.9 = -0.8
            // new EF = max(1.3, 2.5 - 0.8) = max(1.3, 1.7) = 1.7
            expect(result.easeFactor).toBeCloseTo(1.7, 5);
        });

        it("EF is never below 1.3 (floor clamp)", () => {
            // Start at floor; quality=0 would try to push below 1.3
            const card = makeCard({ easeFactor: 1.3 });
            const result = calculateNextReview(card, "again");
            expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
        });
    });

    // ── Case 2: quality=3 (good, hard in mapped value) repetition sequence ─
    // NOTE: quality=3 maps to ReviewRating "hard" in qualityMap.
    // The SM-2 repetition sequence is: rep1→interval=1, rep2→interval=6,
    // rep≥3→interval=round(prev_interval * EF).
    describe("quality = 3 (hard) repetition sequence", () => {
        it("repetitions=0 → first successful review → interval=1, repetitions=1", () => {
            const card = makeCard({ repetitions: 0, interval: 1, easeFactor: 2.5 });
            const result = calculateNextReview(card, "hard");
            // repetitions becomes 1 → interval = 1, then hard modifier x0.8 → round(1*0.8)=1
            expect(result.repetitions).toBe(1);
            expect(result.interval).toBe(1);
        });

        it("repetitions=1 → second review → base interval=6, hard modifier → round(6*0.8)=5", () => {
            const card = makeCard({ repetitions: 1, interval: 1, easeFactor: 2.5 });
            const result = calculateNextReview(card, "hard");
            // repetitions becomes 2 → interval=6, hard x0.8 → round(4.8)=5
            expect(result.repetitions).toBe(2);
            expect(result.interval).toBe(5);
        });

        it("repetitions=2 → third review → base interval=round(prev*EF), hard modifier applied", () => {
            const card = makeCard({ repetitions: 2, interval: 6, easeFactor: 2.5 });
            const newEF = computeNewEF(2.5, 3); // quality=3
            // repetitions becomes 3 → interval=round(6*newEF), hard x0.8
            const expectedBase = Math.round(6 * newEF);
            const expected = Math.round(expectedBase * 0.8);
            const result = calculateNextReview(card, "hard");
            expect(result.repetitions).toBe(3);
            expect(result.interval).toBe(expected);
        });

        it("repetitions=5 → interval grows correctly (round(prev*EF) with hard modifier)", () => {
            const prevInterval = 30;
            const card = makeCard({ repetitions: 5, interval: prevInterval, easeFactor: 2.5 });
            const newEF = computeNewEF(2.5, 3);
            const expectedBase = Math.round(prevInterval * newEF);
            const expected = Math.round(expectedBase * 0.8);
            const result = calculateNextReview(card, "hard");
            expect(result.repetitions).toBe(6);
            expect(result.interval).toBe(expected);
        });
    });

    // ── Case 3: quality=5 (easy) consecutive – EF ceiling clamp ─────────
    describe("quality = 5 (easy) repeated – EF ceiling clamp at 2.8", () => {
        it("EF never exceeds 2.8 after many 'easy' reviews", () => {
            let card = makeCard({ easeFactor: 2.5 });
            for (let i = 0; i < 20; i++) {
                const result = calculateNextReview(card, "easy");
                card = {
                    ...card,
                    easeFactor: result.easeFactor!,
                    interval: result.interval!,
                    repetitions: result.repetitions!,
                };
            }
            expect(card.easeFactor).toBeLessThanOrEqual(2.8);
            // Also confirm it's been pushed to ceiling (starting at 2.5, easy always increases)
            expect(card.easeFactor).toBe(2.8);
        });
    });

    // ── Case 4: quality=0 (again) consecutive – EF floor clamp ─────────
    describe("quality = 0 (again) repeated – EF floor clamp at 1.3", () => {
        it("EF never goes below 1.3 after many 'again' reviews", () => {
            let card = makeCard({ easeFactor: 2.5 });
            for (let i = 0; i < 20; i++) {
                const result = calculateNextReview(card, "again");
                card = {
                    ...card,
                    easeFactor: result.easeFactor!,
                    interval: result.interval!,
                    repetitions: result.repetitions!,
                };
            }
            expect(card.easeFactor).toBeGreaterThanOrEqual(1.3);
            // Also confirm it's been pushed to floor
            expect(card.easeFactor).toBe(1.3);
        });
    });

    // ── Case 5: nextReview date is set correctly ─────────────────────────
    describe("nextReview date", () => {
        it("nextReview is in the future by 'interval' days", () => {
            const card = makeCard({ repetitions: 2, interval: 6, easeFactor: 2.5 });
            const before = Date.now();
            const result = calculateNextReview(card, "good");
            const nextMs = result.nextReview!.getTime();
            // Should be roughly interval days ahead (allow ±1 day for edge-of-day timing)
            const daysAhead = (nextMs - before) / (1000 * 60 * 60 * 24);
            expect(daysAhead).toBeGreaterThan(result.interval! - 1);
            expect(daysAhead).toBeLessThan(result.interval! + 1);
        });
    });
});
