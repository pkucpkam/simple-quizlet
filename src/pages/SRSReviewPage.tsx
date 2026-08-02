import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { srsService } from "../service/srsService";
import ReviewCard from "../components/srs/ReviewCard";
import type { SRSCard, ReviewRating } from "../types/srs";
import toast from "react-hot-toast";
import { historyService } from "../service/historyService";
import { auth } from "../service/firebase_setup";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

/**
 * Session Queue Design:
 * - `sessionQueue` is a local array of cards the user still needs to answer
 *   correctly at least once in this session.
 * - When the user rates a card "again", it is pushed to the END of the queue
 *   so they'll see it again — the session does NOT end until every unique
 *   card has been answered correctly at least once.
 * - We track which card IDs have already been written to Firestore in this
 *   session (`persistedIds`). The first time a card is answered correctly we
 *   write it; subsequent re-queues of the same card are local-only.
 *   Rationale: writing only the final correct result avoids polluting review
 *   history with spurious "again" repetitions within a single sitting, while
 *   still reflecting the most up-to-date SRS data.
 */

const CATCHUP_THRESHOLD = 200;
const BATCH_SIZE = 20;

export default function SRSReviewPage() {
    const navigate = useNavigate();

    // ── Session queue (local-only, drives what card is shown) ──────────────
    const [sessionQueue, setSessionQueue] = useState<SRSCard[]>([]);
    const [currentIndex] = useState(0);

    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Tracks card IDs already persisted to Firestore in this session
    const persistedIds = useRef<Set<string>>(new Set());

    // Session stats (unique cards answered correctly)
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [totalUniqueCards, setTotalUniqueCards] = useState(0);
    const [startTime] = useState(Date.now());

    // Catch-up mode
    const [showCatchupModal, setShowCatchupModal] = useState(false);
    const [totalDueCount, setTotalDueCount] = useState(0);

    // ── Load cards ─────────────────────────────────────────────────────────
    useEffect(() => {
        const loadDueCards = async () => {
            const userId = auth.currentUser?.uid;

            if (!userId) {
                toast.error("Vui lòng đăng nhập để ôn tập");
                navigate("/login");
                return;
            }

            try {
                setLoading(true);
                const dueCards = await srsService.getDueCardsForUser(userId);

                if (dueCards.length === 0) {
                    toast.success("🎉 Bạn đã hoàn thành hết bài ôn hôm nay!");
                    navigate("/");
                    return;
                }

                const count = dueCards.length;
                setTotalDueCount(count);

                // Catch-up mode: if backlog is huge, offer to study a small batch
                if (count > CATCHUP_THRESHOLD) {
                    setShowCatchupModal(true);
                    setSessionQueue(dueCards); // store full list so user can choose
                } else {
                    setSessionQueue(dueCards);
                    setTotalUniqueCards(dueCards.length);
                }

                const sid = await srsService.startReviewSession(userId);
                setSessionId(sid);
            } catch (error) {
                console.error("Error loading due cards:", error);
                toast.error("Không thể tải thẻ ôn tập");
            } finally {
                setLoading(false);
            }
        };

        loadDueCards();
    }, [navigate]);

    // ── Catch-up: start full session ───────────────────────────────────────
    const handleStartFullSession = () => {
        setTotalUniqueCards(sessionQueue.length);
        setShowCatchupModal(false);
    };

    // ── Catch-up: start batch session (first BATCH_SIZE cards) ────────────
    const handleStartBatchSession = () => {
        const batch = sessionQueue.slice(0, BATCH_SIZE);
        setSessionQueue(batch);
        setTotalUniqueCards(batch.length);
        setShowCatchupModal(false);
    };

    // ── Handle rating ──────────────────────────────────────────────────────
    const handleReview = async (rating: ReviewRating) => {
        try {
            const currentCard = sessionQueue[currentIndex];
            const cardId = currentCard.id!;
            const isCorrect = rating !== "again";

            if (isCorrect) {
                // Persist to Firestore only the FIRST correct answer per card
                if (!persistedIds.current.has(cardId)) {
                    await srsService.reviewCard(cardId, rating);
                    persistedIds.current.add(cardId);
                    setCorrectCount((prev) => prev + 1);
                }
                // Remove the card from the queue and advance
                setSessionQueue((prev) => {
                    const next = prev.filter((_, i) => i !== currentIndex);
                    return next;
                });
                // currentIndex stays the same — next card slides in
                setShowAnswer(false);

                // Check if session is done (queue is now empty)
                if (sessionQueue.length <= 1) {
                    await finishSession(true);
                }
            } else {
                // "again" — push card to the END of the queue
                setIncorrectCount((prev) => prev + 1);
                setSessionQueue((prev) => {
                    const card = prev[currentIndex];
                    const without = prev.filter((_, i) => i !== currentIndex);
                    return [...without, card];
                });
                // currentIndex stays the same — next card slides in (or wraps)
                setShowAnswer(false);
            }
        } catch (error) {
            console.error("Error reviewing card:", error);
            toast.error("Không thể cập nhật thẻ");
        }
    };

    // ── Finish session ─────────────────────────────────────────────────────
    const finishSession = async (fromQueue = false) => {
        try {
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            const reviewed = correctCount + (fromQueue ? 0 : 1);

            if (sessionId) {
                await srsService.endReviewSession(sessionId, {
                    cardsReviewed: reviewed,
                    correctCount: reviewed,
                    incorrectCount,
                    totalTime,
                });
            }

            const userId = auth.currentUser?.uid;
            if (userId) {
                await historyService.incrementStudyStats(userId, "review", totalTime);
            }

            toast.success(
                `🎉 Hoàn thành! ${reviewed}/${totalUniqueCards} thẻ đã thuộc`
            );
            navigate("/");
        } catch (error) {
            console.error("Error finishing session:", error);
            navigate("/");
        }
    };

    // ── Normalise currentIndex when queue shrinks ──────────────────────────
    // After a card is removed or re-queued, clamp index to valid range
    const safeIndex = Math.min(currentIndex, Math.max(0, sessionQueue.length - 1));

    // ── Render ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-claude-border border-t-claude-accent mx-auto mb-4"></div>
                    <p className="text-claude-text-2 font-medium">Đang tải thẻ ôn tập...</p>
                </div>
            </div>
        );
    }

    if (sessionQueue.length === 0 && !loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] py-20 animate-fade-in">
                <div className="text-center max-w-md bg-claude-surface border border-claude-border rounded-claude-lg p-8 shadow-claude">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-claude-text mb-2">Tuyệt vời!</h2>
                    <p className="text-claude-text-2 mb-6">Bạn đã hoàn thành hết bài ôn hôm nay</p>
                    <Button onClick={() => navigate("/")} variant="primary" className="w-full">
                        Về trang chủ
                    </Button>
                </div>
            </div>
        );
    }

    const currentCard = sessionQueue[safeIndex];
    // Cards still pending = total unique cards not yet persisted
    const pendingCount = sessionQueue.length;

    return (
        <>
            {/* ── Catch-up Modal ─────────────────────────────────────────── */}
            <Modal
                open={showCatchupModal}
                onClose={() => setShowCatchupModal(false)}
                title="Bạn có nhiều thẻ cần ôn 📚"
                size="sm"
                showClose={false}
            >
                <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-claude-accent-light border border-claude-border flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📚</span>
                    </div>
                    <p className="text-sm text-claude-text-2 mb-2">
                        Bạn đang có{" "}
                        <span className="font-bold text-claude-error">{totalDueCount}</span>{" "}
                        thẻ đến hạn hôm nay.
                    </p>
                    <p className="text-sm text-claude-text-2 mb-6">
                        Học toàn bộ một lúc có thể gây mệt mỏi. Bạn muốn học theo đợt nhỏ không?
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button variant="primary" className="w-full justify-center" onClick={handleStartBatchSession}>
                            ✅ Học {BATCH_SIZE} thẻ trước
                        </Button>
                        <Button variant="secondary" className="w-full justify-center" onClick={handleStartFullSession}>
                            Học hết {totalDueCount} thẻ
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── Main Review UI ─────────────────────────────────────────── */}
            {!showCatchupModal && currentCard && (
                <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => navigate("/")}
                                className="text-claude-text-3 hover:text-claude-accent flex items-center gap-2 font-medium transition-colors"
                            >
                                <span className="text-xl">←</span> Thoát
                            </button>
                            <div className="text-sm text-claude-text-2 flex items-center gap-3">
                                <span className="font-semibold text-claude-success">{correctCount}</span>
                                <span className="text-claude-text-3">đúng</span>
                                <span className="text-claude-text-3">•</span>
                                <span className="font-semibold text-claude-error">{incorrectCount}</span>
                                <span className="text-claude-text-3">sai</span>
                                <span className="text-claude-text-3">•</span>
                                <span className="font-semibold text-claude-text">{pendingCount}</span>
                                <span className="text-claude-text-3">còn lại</span>
                            </div>
                        </div>

                        {/* Progress bar: ratio of unique cards persisted vs total */}
                        <div className="mt-3 w-full bg-claude-border rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-claude-accent h-1.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${totalUniqueCards > 0 ? (correctCount / totalUniqueCards) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    {/* Review Card */}
                    <ReviewCard
                        card={currentCard}
                        onReview={handleReview}
                        showAnswer={showAnswer}
                        onShowAnswer={() => setShowAnswer(true)}
                        totalCards={totalUniqueCards}
                        currentIndex={correctCount}
                    />

                    {/* Keyboard shortcuts hint */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-claude-text-3 font-medium">
                            💡 Gợi ý: Sử dụng phím{" "}
                            <kbd className="px-2 py-1 bg-claude-surface border border-claude-border shadow-claude-sm rounded text-xs">
                                Space
                            </kbd>{" "}
                            để hiện đáp án
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
