import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lessonService } from "../service/lessonService";
import toast from "react-hot-toast";

interface VocabItem {
    term: string;
    definition: string;
}

interface TestResult {
    term: string;
    definition: string;
    userAnswer: string;
    isCorrect: boolean;
}

export default function TestPage() {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();

    const [vocabList, setVocabList] = useState<VocabItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState("");
    const [results, setResults] = useState<TestResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [lessonTitle, setLessonTitle] = useState("");

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                if (!lessonId) return;
                const lesson = await lessonService.getLesson(lessonId);
                setLessonTitle(lesson.title);

                const vocabData = lesson.vocabulary.map((item: { word: string; definition: string }) => ({
                    term: item.word,
                    definition: item.definition,
                }));

                // Shuffle the vocabulary list
                const shuffled = [...vocabData].sort(() => Math.random() - 0.5);
                setVocabList(shuffled);
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu bài học:", error);
                toast.error("Không thể tải bài học. Vui lòng thử lại.");
                navigate("/test-page");
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [lessonId, navigate]);

    const currentVocab = vocabList[currentIndex];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!userInput.trim()) {
            toast.error("Vui lòng nhập câu trả lời!");
            return;
        }

        const isCorrect = userInput.trim().toLowerCase() === currentVocab.term.toLowerCase();

        setResults([
            ...results,
            {
                term: currentVocab.term,
                definition: currentVocab.definition,
                userAnswer: userInput.trim(),
                isCorrect,
            },
        ]);

        // Move to next question
        if (currentIndex < vocabList.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setUserInput("");
        } else {
            // Test completed
            setShowResults(true);
        }
    };

    const handleSkip = () => {
        setResults([
            ...results,
            {
                term: currentVocab.term,
                definition: currentVocab.definition,
                userAnswer: "",
                isCorrect: false,
            },
        ]);

        if (currentIndex < vocabList.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setUserInput("");
        } else {
            setShowResults(true);
        }
    };

    const handleRestart = () => {
        const shuffled = [...vocabList].sort(() => Math.random() - 0.5);
        setVocabList(shuffled);
        setCurrentIndex(0);
        setUserInput("");
        setResults([]);
        setShowResults(false);
    };

    const renderWordWithUnderscores = () => {
        const word = currentVocab.term;
        const userInputLower = userInput.toLowerCase();

        return word.split("").map((char, index) => {
            if (char === " ") {
                return <span key={index} className="inline-block w-4"></span>;
            }

            const isRevealed = userInputLower[index] && userInputLower[index].toLowerCase() === char.toLowerCase();

            return (
                <span
                    key={index}
                    className="inline-flex items-center justify-center w-8 h-10 mx-0.5 border-b-2 border-purple-600 text-lg font-semibold"
                >
                    {isRevealed ? char : "_"}
                </span>
            );
        });
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center">
                <p className="text-gray-500 text-lg">Đang tải bài kiểm tra...</p>
            </div>
        );
    }

    if (showResults) {
        const correctCount = results.filter((r) => r.isCorrect).length;
        const totalCount = results.length;
        const percentage = Math.round((correctCount / totalCount) * 100);
        const incorrectResults = results.filter((r) => !r.isCorrect);

        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
                        Kết quả kiểm tra: {lessonTitle}
                    </h1>

                    {/* Score Summary */}
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-6 mb-6">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-purple-700 mb-2">
                                {percentage}%
                            </div>
                            <div className="text-lg text-gray-700">
                                {correctCount} / {totalCount} câu đúng
                            </div>
                        </div>

                        <div className="mt-4 flex justify-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                                <span className="text-sm">Đúng: {correctCount}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                                <span className="text-sm">Sai: {totalCount - correctCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Wrong Answers */}
                    {incorrectResults.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-red-600 mb-4">
                                Các từ cần ôn lại ({incorrectResults.length})
                            </h2>
                            <div className="space-y-3">
                                {incorrectResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className="bg-red-50 border border-red-200 rounded-lg p-4"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <span className="text-xs text-gray-500 font-medium">Nghĩa:</span>
                                                <p className="text-gray-800 font-medium">{result.definition}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 font-medium">Đáp án đúng:</span>
                                                <p className="text-green-700 font-semibold">{result.term}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 font-medium">Câu trả lời của bạn:</span>
                                                <p className="text-red-700 font-semibold">
                                                    {result.userAnswer || "(Bỏ qua)"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button
                            onClick={handleRestart}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md"
                        >
                            🔄 Làm lại
                        </button>
                        <button
                            onClick={() => navigate("/test-page")}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                        >
                            📚 Chọn bài khác
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md"
                        >
                            🏠 Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-purple-700">
                        Kiểm tra: {lessonTitle}
                    </h1>
                    <div className="text-sm text-gray-600 font-medium">
                        Câu {currentIndex + 1} / {vocabList.length}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
                    <div
                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / vocabList.length) * 100}%` }}
                    ></div>
                </div>

                {/* Definition (Question) */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                        Nghĩa tiếng Việt:
                    </label>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                        <p className="text-2xl text-gray-800 font-medium text-center">
                            {currentVocab.definition}
                        </p>
                    </div>
                </div>

                {/* Word with Underscores */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                        Từ tiếng Anh:
                    </label>
                    <div className="flex justify-center flex-wrap gap-1 mb-4 min-h-[60px]">
                        {renderWordWithUnderscores()}
                    </div>
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            Nhập câu trả lời:
                        </label>
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg"
                            placeholder="Gõ từ tiếng Anh..."
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Gợi ý: Từ có {currentVocab.term.length} ký tự
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md"
                        >
                            ✓ Xác nhận
                        </button>
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium shadow-md"
                        >
                            ⏭ Bỏ qua
                        </button>
                    </div>
                </form>

                {/* Hint */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                        💡 <strong>Mẹo:</strong> Mỗi dấu gạch dưới (_) đại diện cho một ký tự.
                        Khi bạn gõ đúng, ký tự sẽ hiện ra dần.
                    </p>
                </div>
            </div>
        </div>
    );
}
