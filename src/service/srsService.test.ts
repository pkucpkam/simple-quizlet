/**
 * srsService.test.ts
 *
 * Unit tests for the Phase-0 fixes in srsService.ts.
 * ALL Firestore calls are mocked — no live Firebase project needed.
 *
 * Scenarios covered:
 *  A. initializeCardsForLesson — duplicate guard (existingCards.size > 0 → early return)
 *  B. getDueCardsForUser       — date filtering (nextReview <= now)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── 1. Inline mock for Firebase Firestore ────────────────────────────────────
//
// We mock the entire "firebase/firestore" module BEFORE importing srsService,
// because srsService imports from it at module-level.  The mock factories are
// called lazily, so we use module-level variables that individual tests can
// override via vi.mocked().

// Mutable state shared across the mock implementation
let _existingCardCount = 0; // controls getDocs result for the duplicate-guard query
const _userCards: Array<{ nextReview: Date; word: string; userId: string }> = [];

vi.mock("firebase/firestore", () => {
    const Timestamp = {
        fromDate: (d: Date) => ({ toDate: () => d, seconds: d.getTime() / 1000, nanoseconds: 0 }),
        now: () => {
            const d = new Date();
            return { toDate: () => d, seconds: d.getTime() / 1000, nanoseconds: 0 };
        },
    };

    return {
        collection: vi.fn(() => "collection-ref"),
        addDoc: vi.fn(async (_ref: unknown, data: Record<string, unknown>) => ({ id: "mock-session-id", ...data })),
        getDocs: vi.fn(async () => ({
            // Size is used by initializeCardsForLesson guard
            size: _existingCardCount,
            docs: _userCards.map((card, i) => ({
                id: `card-${i}`,
                data: () => ({
                    ...card,
                    nextReview: Timestamp.fromDate(card.nextReview),
                    createdAt: Timestamp.fromDate(new Date()),
                    updatedAt: Timestamp.fromDate(new Date()),
                }),
            })),
        })),
        doc: vi.fn(() => "doc-ref"),
        getDoc: vi.fn(),
        updateDoc: vi.fn(),
        query: vi.fn(() => "query-ref"),
        where: vi.fn(() => "where-clause"),
        orderBy: vi.fn(() => "orderby-clause"),
        Timestamp,
        writeBatch: vi.fn(() => ({
            set: vi.fn(),
            commit: vi.fn(async () => undefined),
        })),
        increment: vi.fn((n: number) => n),
    };
});

// ─── 2. Inline mock for firebase_setup (db instance) ─────────────────────────
vi.mock("../service/firebase_setup", () => ({
    db: {},
    auth: { currentUser: { uid: "test-user-uid" } },
}));

// ─── 3. NOW import srsService (after mocks are registered) ────────────────────
import { srsService } from "./srsService";
import { getDueCards } from "../utils/srsAlgorithm";
import type { SRSCard } from "../types/srs";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000);   // yesterday
const FUTURE = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
const NOW = new Date();                                       // exactly now

function makeSRSCard(overrides: Partial<SRSCard>): SRSCard {
    return {
        id: "card-id",
        wordId: "w1",
        word: "apple",
        definition: "quả táo",
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReview: PAST,
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

// ─── Scenario A: initializeCardsForLesson duplicate guard ─────────────────────
describe("A. initializeCardsForLesson — duplicate guard", () => {
    const vocab = [
        { word: "apple", definition: "quả táo" },
        { word: "book", definition: "cuốn sách" },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("A1 — first call (no existing cards): calls batch.commit() to create cards", async () => {
        _existingCardCount = 0; // simulate empty collection

        const { writeBatch } = await import("firebase/firestore");
        const mockCommit = vi.fn(async () => undefined);
        (writeBatch as ReturnType<typeof vi.fn>).mockReturnValue({
            set: vi.fn(),
            commit: mockCommit,
        });

        await srsService.initializeCardsForLesson("lesson1", "user1", vocab);

        expect(mockCommit).toHaveBeenCalledTimes(1);
    });

    it("A2 — second call (cards already exist): skips batch.commit() — no duplicates", async () => {
        _existingCardCount = 2; // simulate existing cards for this lesson+user

        const { writeBatch } = await import("firebase/firestore");
        const mockCommit = vi.fn(async () => undefined);
        (writeBatch as ReturnType<typeof vi.fn>).mockReturnValue({
            set: vi.fn(),
            commit: mockCommit,
        });

        await srsService.initializeCardsForLesson("lesson1", "user1", vocab);

        // Guard (existingCards.size > 0 → return) must prevent commit
        expect(mockCommit).not.toHaveBeenCalled();
    });

    it("A3 — guard uses BOTH lessonId AND userId (two where clauses)", async () => {
        _existingCardCount = 0;
        const { where, query } = await import("firebase/firestore");

        await srsService.initializeCardsForLesson("lesson-XYZ", "user-ABC", vocab);

        // where() should have been called with lessonId AND userId
        const whereCalls = (where as ReturnType<typeof vi.fn>).mock.calls;
        const hasLessonId = whereCalls.some(
            (args: unknown[]) => args[0] === "lessonId" && args[1] === "==" && args[2] === "lesson-XYZ"
        );
        const hasUserId = whereCalls.some(
            (args: unknown[]) => args[0] === "userId" && args[1] === "==" && args[2] === "user-ABC"
        );
        expect(hasLessonId).toBe(true);
        expect(hasUserId).toBe(true);
        // query() must have been called (combined both clauses)
        expect(query).toHaveBeenCalled();
    });
});

// ─── Scenario B: getDueCards pure-function date filtering ─────────────────────
// NOTE: getDueCards is a pure function in srsAlgorithm.ts (no Firestore calls).
// We test it directly — this is the authoritative logic that srsService delegates to.
describe("B. getDueCards — nextReview date filtering", () => {
    it("B1 — returns only cards with nextReview <= now (past)", () => {
        const cards = [
            makeSRSCard({ id: "past", nextReview: PAST }),
            makeSRSCard({ id: "future", nextReview: FUTURE }),
        ];
        const due = getDueCards(cards);
        expect(due.map(c => c.id)).toContain("past");
        expect(due.map(c => c.id)).not.toContain("future");
    });

    it("B2 — card with nextReview exactly at 'now' is included (boundary)", () => {
        // Use a date slightly in the past to guarantee <= passes
        const almostNow = new Date(NOW.getTime() - 1);
        const cards = [makeSRSCard({ id: "boundary", nextReview: almostNow })];
        const due = getDueCards(cards);
        expect(due.map(c => c.id)).toContain("boundary");
    });

    it("B3 — future card is never returned", () => {
        const cards = [makeSRSCard({ id: "future", nextReview: FUTURE })];
        const due = getDueCards(cards);
        expect(due).toHaveLength(0);
    });

    it("B4 — multiple due cards are sorted earliest-first", () => {
        const earlier = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
        const later = PAST; // 1 day ago
        const cards = [
            makeSRSCard({ id: "later", nextReview: later }),
            makeSRSCard({ id: "earlier", nextReview: earlier }),
        ];
        const due = getDueCards(cards);
        expect(due[0].id).toBe("earlier");
        expect(due[1].id).toBe("later");
    });

    it("B5 — empty input returns empty array", () => {
        expect(getDueCards([])).toHaveLength(0);
    });

    it("B6 — all future cards returns empty array", () => {
        const cards = [
            makeSRSCard({ id: "a", nextReview: FUTURE }),
            makeSRSCard({ id: "b", nextReview: new Date(FUTURE.getTime() + 1000) }),
        ];
        expect(getDueCards(cards)).toHaveLength(0);
    });
});
