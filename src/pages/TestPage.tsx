import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { lessonService } from "../service/lessonService";
import toast from "react-hot-toast";
import { historyService } from "../service/historyService";
import { auth } from "../service/firebase_setup";
import { lessonScoreService } from "../service/lessonScoreService";
import LoadingScreen from "../components/common/LoadingScreen";
import Button from "../components/ui/Button";
import { ArrowLeft } from "lucide-react";

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

const getBackLabel = (path: string) => {
  if (path === "/") return "🏠 Về trang chủ";
  if (path.startsWith("/folder/")) return "📁 Về thư mục";
  if (path.startsWith("/lesson/")) return "📖 Về bài học";
  if (path.startsWith("/study-history")) return "🕒 Về lịch sử";
  return "⬅️ Quay lại";
};

export default function TestPage() {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const fromPath = location.state?.from || (lessonId ? `/lesson/${lessonId}` : "/");

    const [vocabList, setVocabList] = useState<VocabItem[]>([]);
    const [originalVocabList, setOriginalVocabList] = useState<VocabItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState("");
    const [results, setResults] = useState<TestResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [lessonTitle, setLessonTitle] = useState("");
    const [startTime, setStartTime] = useState(Date.now());
    const [hasSaved, setHasSaved] = useState(false);

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

                const shuffled = [...vocabData].sort(() => Math.random() - 0.5);
                setVocabList(shuffled);
                setOriginalVocabList(vocabData);
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu bài học:", error);
                toast.error("Không thể tải bài học. Vui lòng thử lại.");
                navigate("/");
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

        if (currentIndex < vocabList.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setUserInput("");
        } else {
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
        const shuffled = [...originalVocabList].sort(() => Math.random() - 0.5);
        setVocabList(shuffled);
        setCurrentIndex(0);
        setUserInput("");
        setResults([]);
        setShowResults(false);
        setStartTime(Date.now());
        setHasSaved(false);
    };

    const handleRestartIncorrect = () => {
        const incorrectVocabs = results
            .filter((r) => !r.isCorrect)
            .map((r) => ({ term: r.term, definition: r.definition }));
        
        const shuffled = [...incorrectVocabs].sort(() => Math.random() - 0.5);
        setVocabList(shuffled);
        setCurrentIndex(0);
        setUserInput("");
        setResults([]);
        setShowResults(false);
        setStartTime(Date.now());
        setHasSaved(false);
    };

    useEffect(() => {
        if (showResults && !hasSaved) {
            const userId = auth.currentUser?.uid;
            if (!userId) return;

            const timeSpent = Math.round((Date.now() - startTime) / 1000);

            historyService.incrementStudyStats(userId, "test", timeSpent);
            
            if (lessonId && lessonTitle) {
                lessonScoreService.incrementScore(userId, lessonId, lessonTitle);
            }
            
            setHasSaved(true);
        }
    }, [showResults, hasSaved, lessonId, lessonTitle, startTime, results]);

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
                    className="inline-flex items-center justify-center w-8 h-10 mx-0.5 border-b-2 border-claude-accent text-claude-text text-lg font-semibold"
                >
                    {isRevealed ? char : "_"}
                </span>
            );
        });
    };

    if (loading) {
        return <LoadingScreen />;
    }

    if (showResults) {
        const correctCount = results.filter((r) => r.isCorrect).length;
        const totalCount = results.length;
        const percentage = Math.round((correctCount / totalCount) * 100);
        const incorrectResults = results.filter((r) => !r.isCorrect);

        return (
            <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
                <div className="mb-6 flex justify-start">
                    <button
                        onClick={() => navigate(fromPath)}
                        className="text-claude-text-3 hover:text-claude-accent flex items-center gap-2 font-medium transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Thoát
                    </button>
                </div>

                <div className="bg-claude-surface rounded-claude-lg shadow-claude border border-claude-border p-6 md:p-8">
                    <h1 className="text-3xl font-bold text-claude-text mb-6 text-center">
                        Kết quả kiểm tra: {lessonTitle}
                    </h1>

                    {/* Score Summary */}
                    <div className="bg-claude-surface-2 border border-claude-border rounded-claude-md p-6 mb-6">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-claude-accent mb-2">
                                {percentage}%
                            </div>
                            <div className="text-lg text-claude-text-2">
                                {correctCount} / {totalCount} câu đúng
                            </div>
                        </div>

                        <div className="mt-4 flex justify-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 bg-claude-success rounded-full"></span>
                                <span className="text-sm text-claude-text-2">Đúng: {correctCount}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 bg-claude-error rounded-full"></span>
                                <span className="text-sm text-claude-text-2">Sai: {totalCount - correctCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Wrong Answers */}
                    {incorrectResults.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-claude-error mb-4">
                                Các từ cần ôn lại ({incorrectResults.length})
                            </h2>
                            <div className="space-y-3">
                                {incorrectResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className="bg-claude-error-light border border-claude-error/20 rounded-claude p-4"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                            <div>
                                                <span className="text-xs text-claude-text-3 font-medium uppercase tracking-wider">Nghĩa:</span>
                                                <p className="text-claude-text font-medium mt-0.5">{result.definition}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-claude-text-3 font-medium uppercase tracking-wider">Đáp án đúng:</span>
                                                <p className="text-claude-success font-semibold mt-0.5">{result.term}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-claude-text-3 font-medium uppercase tracking-wider">Câu trả lời của bạn:</span>
                                                <p className="text-claude-error font-semibold mt-0.5">
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
                    <div className="flex flex-wrap gap-4 justify-center border-t border-claude-border pt-6 mt-6">
                        <Button
                            onClick={handleRestart}
                            variant="primary"
                            className="px-8"
                        >
                            🔄 Làm lại từ đầu
                        </Button>
                        {incorrectResults.length > 0 && (
                            <Button
                                onClick={handleRestartIncorrect}
                                variant="outline"
                                className="px-8"
                            >
                                🎯 Làm lại câu sai
                            </Button>
                        )}
                        <Button
                            onClick={() => navigate(fromPath)}
                            variant="secondary"
                            className="px-8"
                        >
                            {getBackLabel(fromPath)}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
            <div className="mb-6 flex justify-start">
                <button
                    onClick={() => navigate(fromPath)}
                    className="text-claude-text-3 hover:text-claude-accent flex items-center gap-2 font-medium transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Thoát
                </button>
            </div>

            <div className="bg-claude-surface rounded-claude-lg shadow-claude border border-claude-border p-6 md:p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-claude-text truncate max-w-[70%]">
                        Kiểm tra: {lessonTitle}
                    </h1>
                    <div className="text-sm text-claude-text-3 font-medium">
                        Câu {currentIndex + 1} / {vocabList.length}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-claude-border rounded-full h-2 mb-8 overflow-hidden">
                    <div
                        className="bg-claude-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / vocabList.length) * 100}%` }}
                    ></div>
                </div>

                {/* Definition (Question) */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-claude-text-2 mb-2 uppercase tracking-wider">
                        Nghĩa tiếng Việt:
                    </label>
                    <div className="bg-claude-accent-lighter border-2 border-claude-accent-light rounded-claude-md p-6">
                        <p className="text-2xl text-claude-text font-medium text-center">
                            {currentVocab.definition}
                        </p>
                    </div>
                </div>

                {/* Word with Underscores */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-claude-text-2 mb-2 uppercase tracking-wider">
                        Từ tiếng Anh:
                    </label>
                    <div className="flex justify-center flex-wrap gap-1 mb-4 min-h-[60px]">
                        {renderWordWithUnderscores()}
                    </div>
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-claude-text">
                            Nhập câu trả lời:
                        </label>
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            className="w-full px-4 py-3 bg-claude-surface border border-claude-border rounded-claude focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent text-lg text-claude-text"
                            placeholder="Gõ từ tiếng Anh..."
                            autoFocus
                        />
                        <p className="text-xs text-claude-text-3 font-medium">
                            Gợi ý: Từ có {currentVocab.term.length} ký tự
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 border-t border-claude-border pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1 py-3"
                        >
                            ✓ Xác nhận
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSkip}
                            variant="secondary"
                            className="flex-1 py-3"
                        >
                            ⏭ Bỏ qua
                        </Button>
                    </div>
                </form>

                {/* Hint */}
                <div className="mt-6 p-4 bg-claude-accent-lighter border border-claude-accent-light rounded-claude text-sm">
                    <p className="text-claude-text-2 leading-relaxed">
                        💡 <strong>Mẹo:</strong> Mỗi dấu gạch dưới (_) đại diện cho một ký tự.
                        Khi bạn gõ đúng, ký tự sẽ hiện ra dần.
                    </p>
                </div>
            </div>
        </div>
    );
}
