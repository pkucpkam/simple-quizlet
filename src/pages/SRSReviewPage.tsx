import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { srsService } from "../service/srsService";
import ReviewCard from "../components/srs/ReviewCard";
import type { SRSCard, ReviewRating } from "../types/srs";
import toast from "react-hot-toast";

export default function ReviewPage() {
    const navigate = useNavigate();
    const [cards, setCards] = useState<SRSCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Session stats
    const [reviewedCount, setReviewedCount] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [startTime] = useState(Date.now());

    const storedUser = sessionStorage.getItem("user");
    const username = storedUser ? JSON.parse(storedUser).username : null;

    useEffect(() => {
        const loadDueCards = async () => {
            try {
                setLoading(true);
                const dueCards = await srsService.getDueCardsForUser(username);

                if (dueCards.length === 0) {
                    toast.success("🎉 Bạn đã hoàn thành hết bài ôn hôm nay!");
                    navigate("/");
                    return;
                }

                setCards(dueCards);

                // Start review session
                const sessionId = await srsService.startReviewSession(username);
                setSessionId(sessionId);
            } catch (error) {
                console.error("Error loading due cards:", error);
                toast.error("Không thể tải thẻ ôn tập");
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            loadDueCards();
        } else {
            toast.error("Vui lòng đăng nhập để ôn tập");
            navigate("/login");
        }
    }, [username, navigate]);

    const handleReview = async (rating: ReviewRating) => {
        try {
            const currentCard = cards[currentIndex];

            // Update card in database
            await srsService.reviewCard(currentCard.id!, rating);

            // Update stats
            const isCorrect = rating !== "again";
            setReviewedCount((prev) => prev + 1);
            if (isCorrect) {
                setCorrectCount((prev) => prev + 1);
            } else {
                setIncorrectCount((prev) => prev + 1);
            }

            // Move to next card
            if (currentIndex < cards.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                setShowAnswer(false);
            } else {
                // Finish session
                await finishSession();
            }
        } catch (error) {
            console.error("Error reviewing card:", error);
            toast.error("Không thể cập nhật thẻ");
        }
    };

    const finishSession = async () => {
        try {
            const totalTime = Math.round((Date.now() - startTime) / 1000); // seconds

            if (sessionId) {
                await srsService.endReviewSession(sessionId, {
                    cardsReviewed: reviewedCount + 1,
                    correctCount: correctCount + (showAnswer ? 1 : 0),
                    incorrectCount,
                    totalTime,
                });
            }

            // Show completion modal
            toast.success(
                `🎉 Hoàn thành! ${correctCount + 1}/${reviewedCount + 1} đúng (${Math.round(
                    ((correctCount + 1) / (reviewedCount + 1)) * 100
                )}%)`
            );

            navigate("/");
        } catch (error) {
            console.error("Error finishing session:", error);
            navigate("/");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thẻ ôn tập...</p>
                </div>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Tuyệt vời!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Bạn đã hoàn thành hết bài ôn hôm nay
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            {/* Header */}
            <div className="max-w-2xl mx-auto mb-6">
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => navigate("/")}
                        className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
                    >
                        <span className="text-xl">←</span> Thoát
                    </button>
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold text-green-600">{correctCount}</span> đúng •{" "}
                        <span className="font-semibold text-red-600">{incorrectCount}</span> sai
                    </div>
                </div>
            </div>

            {/* Review Card */}
            <ReviewCard
                card={currentCard}
                onReview={handleReview}
                showAnswer={showAnswer}
                onShowAnswer={() => setShowAnswer(true)}
                totalCards={cards.length}
                currentIndex={currentIndex}
            />

            {/* Keyboard shortcuts hint */}
            <div className="max-w-2xl mx-auto mt-8 text-center">
                <p className="text-sm text-gray-500">
                    💡 Tip: Sử dụng phím <kbd className="px-2 py-1 bg-gray-200 rounded">Space</kbd> để hiện đáp án
                </p>
            </div>
        </div>
    );
}
