import { useState } from "react";
import type { SRSCard, ReviewRating } from "../../types/srs";
import Button from "../ui/Button";

interface Props {
    card: SRSCard;
    onReview: (rating: ReviewRating) => void;
    showAnswer: boolean;
    onShowAnswer: () => void;
    totalCards: number;
    currentIndex: number;
}

export default function ReviewCard({
    card,
    onReview,
    showAnswer,
    onShowAnswer,
    totalCards,
    currentIndex,
}: Props) {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleShowAnswer = () => {
        setIsFlipped(true);
        onShowAnswer();
    };

    const handleReview = (rating: ReviewRating) => {
        onReview(rating);
        setIsFlipped(false);
    };

    const getRatingColor = (rating: ReviewRating) => {
        switch (rating) {
            case "again":
                return "bg-claude-error hover:bg-red-700";
            case "hard":
                return "bg-claude-accent hover:bg-claude-accent-2";
            case "good":
                return "bg-claude-success hover:bg-green-700";
            case "easy":
                return "bg-claude-info hover:bg-blue-700";
        }
    };

    const getRatingLabel = (rating: ReviewRating) => {
        switch (rating) {
            case "again":
                return "Quên";
            case "hard":
                return "Khó";
            case "good":
                return "Tốt";
            case "easy":
                return "Dễ";
        }
    };

    const getRatingInterval = (rating: ReviewRating) => {
        switch (rating) {
            case "again":
                return "< 1 ngày";
            case "hard":
                return `${Math.round(card.interval * 0.8)} ngày`;
            case "good":
                return `${card.interval} ngày`;
            case "easy":
                return `${Math.round(card.interval * 1.3)} ngày`;
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            {/* Progress */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-claude-text-2 mb-2 font-medium">
                    <span>
                        Thẻ {currentIndex + 1} / {totalCards}
                    </span>
                    <span>Độ khó: {card.easeFactor.toFixed(1)}</span>
                </div>
                <div className="w-full bg-claude-border rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-claude-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                    />
                </div>
            </div>

            {/* Card */}
            <div
                className={`relative bg-claude-surface border border-claude-border rounded-claude-lg shadow-claude-md p-8 min-h-[360px] flex flex-col justify-center items-center transition-all duration-500 ${isFlipped ? "transform" : ""}`}
            >
                {/* Front - Question */}
                {!showAnswer && (
                    <div className="text-center">
                        <div className="mb-4">
                            <span className="text-xs text-claude-text-3 font-bold uppercase tracking-wider">
                                Từ vựng
                            </span>
                        </div>
                        <h2 className="text-5xl font-bold text-claude-text mb-8">{card.word}</h2>

                        {/* Statistics */}
                        <div className="flex gap-8 justify-center text-sm text-claude-text-2 mb-8">
                            <div>
                                <span className="block text-2xl font-bold text-claude-accent">
                                    {card.totalReviews}
                                </span>
                                <span className="text-xs text-claude-text-3">Lần ôn</span>
                            </div>
                            <div>
                                <span className="block text-2xl font-bold text-claude-success">
                                    {card.streak}
                                </span>
                                <span className="text-xs text-claude-text-3">Streak</span>
                            </div>
                            <div>
                                <span className="block text-2xl font-bold text-claude-info">
                                    {card.totalReviews > 0
                                        ? Math.round((card.correctCount / card.totalReviews) * 100)
                                        : 0}
                                    %
                                </span>
                                <span className="text-xs text-claude-text-3">Chính xác</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleShowAnswer}
                            variant="primary"
                            size="lg"
                            className="px-8 py-3 text-base"
                        >
                            Hiện đáp án
                        </Button>
                    </div>
                )}

                {/* Back - Answer */}
                {showAnswer && (
                    <div className="text-center w-full animate-fade-in">
                        <div className="mb-4">
                            <span className="text-xs text-claude-text-3 font-bold uppercase tracking-wider">
                                Nghĩa
                            </span>
                        </div>
                        <h2 className="text-4xl font-bold text-claude-text mb-2">{card.word}</h2>
                        <p className="text-3xl text-claude-text-2 mb-8 font-medium">{card.definition}</p>

                        {/* Rating Buttons */}
                        <div className="space-y-3 max-w-md mx-auto">
                            <p className="text-sm text-claude-text-3 font-medium mb-4">Bạn nhớ từ này như thế nào?</p>
                            <div className="grid grid-cols-2 gap-3">
                                {(["again", "hard", "good", "easy"] as ReviewRating[]).map((rating) => (
                                    <button
                                        key={rating}
                                        onClick={() => handleReview(rating)}
                                        className={`${getRatingColor(rating)} text-white px-4 py-3 rounded-claude-md transition transform active:scale-95 shadow-claude-sm`}
                                    >
                                        <div className="font-bold text-base">{getRatingLabel(rating)}</div>
                                        <div className="text-xs opacity-90 mt-0.5">{getRatingInterval(rating)}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="mt-6 text-center text-sm text-claude-text-3 font-medium">
                <p>
                    Lần ôn tiếp theo:{" "}
                    <span className="font-semibold text-claude-text-2">
                        {card.nextReview.toLocaleDateString("vi-VN")}
                    </span>
                </p>
            </div>
        </div>
    );
}
