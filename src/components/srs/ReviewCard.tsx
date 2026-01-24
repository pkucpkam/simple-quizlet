import { useState } from "react";
import type { SRSCard, ReviewRating } from "../../types/srs";

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
                return "bg-red-500 hover:bg-red-600";
            case "hard":
                return "bg-orange-500 hover:bg-orange-600";
            case "good":
                return "bg-green-500 hover:bg-green-600";
            case "easy":
                return "bg-blue-500 hover:bg-blue-600";
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
        // Simplified interval display
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
        <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>
                        Thẻ {currentIndex + 1} / {totalCards}
                    </span>
                    <span>Độ khó: {card.easeFactor.toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                    />
                </div>
            </div>

            {/* Card */}
            <div
                className={`relative bg-white rounded-2xl shadow-2xl p-8 min-h-[400px] flex flex-col justify-center items-center transition-all duration-500 ${isFlipped ? "transform" : ""
                    }`}
            >
                {/* Front - Question */}
                {!showAnswer && (
                    <div className="text-center">
                        <div className="mb-4">
                            <span className="text-sm text-gray-500 uppercase tracking-wide">
                                Từ vựng
                            </span>
                        </div>
                        <h2 className="text-5xl font-bold text-gray-800 mb-8">{card.word}</h2>

                        {/* Statistics */}
                        <div className="flex gap-6 justify-center text-sm text-gray-600 mb-8">
                            <div>
                                <span className="block text-2xl font-bold text-blue-600">
                                    {card.totalReviews}
                                </span>
                                <span>Lần ôn</span>
                            </div>
                            <div>
                                <span className="block text-2xl font-bold text-green-600">
                                    {card.streak}
                                </span>
                                <span>Streak</span>
                            </div>
                            <div>
                                <span className="block text-2xl font-bold text-purple-600">
                                    {card.totalReviews > 0
                                        ? Math.round((card.correctCount / card.totalReviews) * 100)
                                        : 0}
                                    %
                                </span>
                                <span>Chính xác</span>
                            </div>
                        </div>

                        <button
                            onClick={handleShowAnswer}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
                        >
                            Hiện đáp án
                        </button>
                    </div>
                )}

                {/* Back - Answer */}
                {showAnswer && (
                    <div className="text-center w-full">
                        <div className="mb-4">
                            <span className="text-sm text-gray-500 uppercase tracking-wide">
                                Nghĩa
                            </span>
                        </div>
                        <h2 className="text-4xl font-bold text-gray-800 mb-2">{card.word}</h2>
                        <p className="text-3xl text-gray-600 mb-8">{card.definition}</p>

                        {/* Rating Buttons */}
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 mb-4">Bạn nhớ từ này như thế nào?</p>
                            <div className="grid grid-cols-2 gap-3">
                                {(["again", "hard", "good", "easy"] as ReviewRating[]).map((rating) => (
                                    <button
                                        key={rating}
                                        onClick={() => handleReview(rating)}
                                        className={`${getRatingColor(
                                            rating
                                        )} text-white px-6 py-4 rounded-lg transition transform hover:scale-105 shadow-lg`}
                                    >
                                        <div className="font-bold text-lg">{getRatingLabel(rating)}</div>
                                        <div className="text-sm opacity-90">{getRatingInterval(rating)}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="mt-6 text-center text-sm text-gray-500">
                <p>
                    Lần ôn tiếp theo:{" "}
                    <span className="font-semibold">
                        {card.nextReview.toLocaleDateString("vi-VN")}
                    </span>
                </p>
            </div>
        </div>
    );
}
