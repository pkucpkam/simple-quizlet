import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { auth } from "../service/firebase_setup";
import Flashcard from "../components/Flashcard";
import { lessonService, type VocabItem } from "../service/lessonService";
import { historyService } from "../service/historyService";
import { srsService } from "../service/srsService";
import toast from "react-hot-toast";
import ExerciseSelectionModal from "../components/review/ExerciseSelectionModal";
import Button from "../components/ui/Button";
import { ArrowLeft } from "lucide-react";

interface FlashcardData {
  id: string;
  term: string;
  definition: string;
  ipa?: string;
  wordType?: string;
  exampleEn?: string;
  exampleVi?: string;
  status: "know" | "still_learning" | null;
}

const getBackLabel = (path: string) => {
  if (path === "/") return "🏠 Về trang chủ";
  if (path.startsWith("/folder/")) return "📁 Về thư mục";
  if (path.startsWith("/lesson/")) return "📖 Về bài học";
  if (path.startsWith("/study-history")) return "🕒 Về lịch sử";
  return "⬅️ Quay lại";
};

const CompletionScreen: React.FC<{
  flashcards: FlashcardData[];
  onReviewAgain: () => void;
  onTest: () => void;
  onFinish: () => void;
  fromPath: string;
}> = ({ flashcards, onReviewAgain, onTest, onFinish, fromPath }) => {
  const knowCount = flashcards.filter((card) => card.status === "know").length;
  const stillLearningCount = flashcards.filter((card) => card.status === "still_learning").length;

  return (
    <div className="max-w-md mx-auto p-6 text-center bg-claude-surface rounded-claude-lg border border-claude-border shadow-claude animate-fade-in mt-10">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-claude-text mb-4">Chúc mừng! Bạn đã học xong!</h2>
      <div className="space-y-1 mb-6">
        <p className="text-base text-claude-text-2">Số từ đã thuộc: <span className="font-bold text-claude-accent">{knowCount}</span></p>
        <p className="text-base text-claude-text-2">Số từ cần ôn tập: <span className="font-bold text-claude-text-2">{stillLearningCount}</span></p>
      </div>

      <div className="bg-claude-accent-lighter border border-claude-accent-light rounded-claude p-4 mb-6 text-left">
        <p className="text-sm text-claude-accent mb-1">✨ <strong>Đã tạo SRS cards!</strong></p>
        <p className="text-xs text-claude-text-2">Hệ thống sẽ tự động nhắc bạn ôn tập vào đúng thời điểm để đạt hiệu quả ghi nhớ cao nhất.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-4">
          <Button
            variant="secondary"
            className="flex-1 py-3"
            onClick={onReviewAgain}
          >
            🔄 Ôn tập lại (Review)
          </Button>
          <Button
            variant="primary"
            className="flex-1 py-3"
            onClick={onTest}
          >
            📝 Kiểm tra (Test)
          </Button>
        </div>
        <Button
          variant="secondary"
          className="w-full py-3"
          onClick={onFinish}
        >
          {getBackLabel(fromPath)}
        </Button>
      </div>
    </div>
  );
};

const Study: React.FC = () => {
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasSaved, setHasSaved] = useState(false); // Prevent duplicate saves
  const [srsInitialized, setSrsInitialized] = useState(false);
  const location = useLocation();
  const { lessonId: urlLessonId } = useParams<{ lessonId: string }>();
  const lessonId = location.state?.lessonId || urlLessonId;
  const vocabId = location.state?.vocabId || lessonId;
  const [lessonTitle, setLessonTitle] = useState(location.state?.lessonTitle || "");
  const [startTime] = useState(Date.now());
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fromPath = location.state?.from || (lessonId ? `/lesson/${lessonId}` : "/");

  useEffect(() => {
    const fetchVocab = async () => {
      try {
        setLoading(true);
        let vocabList: VocabItem[] = [];

        if (lessonId) {
          const lesson = await lessonService.getLesson(lessonId);
          setLessonTitle(lesson.title);
          vocabList = lesson.vocabulary || [];
        } else if (vocabId) {
          vocabList = await lessonService.getVocabulary(vocabId);
        } else {
          vocabList = [
            { word: "Apple", definition: "Táo" },
            { word: "Book", definition: "Sách" },
            { word: "House", definition: "Nhà" },
          ];
        }

        const formattedFlashcards: FlashcardData[] = vocabList.map((vocab, index) => ({
          id: `${vocabId || lessonId}-${index}`,
          term: vocab.word,
          definition: vocab.definition,
          ipa: vocab.ipa,
          wordType: vocab.wordType,
          exampleEn: vocab.exampleEn,
          exampleVi: vocab.exampleVi,
          status: null,
        }));
        setFlashcards(formattedFlashcards);
        sessionStorage.setItem("flashcards", JSON.stringify(formattedFlashcards));
      } catch (err) {
        console.error("Error in study fetch:", err);
        setError("Không thể tải từ vựng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchVocab();
  }, [vocabId, lessonId, lessonTitle]);

  useEffect(() => {
    if (flashcards.length > 0) {
      sessionStorage.setItem("flashcards", JSON.stringify(flashcards));
    }
  }, [flashcards]);

  useEffect(() => {
    if (isCompleted && flashcards.length > 0 && !hasSaved) {
      const userId = auth.currentUser?.uid;
      const storedUser = sessionStorage.getItem("user");
      const username = storedUser ? JSON.parse(storedUser).username : null;

      if (!userId || !username) {
        console.warn("[Study] No authenticated user found, skipping save.");
        return;
      }

      const timeSpent = Math.round((Date.now() - startTime) / 1000); // seconds

      // Save to study history
      historyService.incrementStudyStats(userId, "flashcard", timeSpent);

      // Initialize SRS cards
      if (lessonId && !srsInitialized) {
        const vocabulary = flashcards.map(card => ({
          word: card.term,
          definition: card.definition
        }));

        srsService.initializeCardsForLesson(lessonId, username, vocabulary)
          .then(() => {
            toast.success("✨ Đã tạo SRS cards cho bài học này!");
            setSrsInitialized(true);
          })
          .catch((error) => {
            console.error("[Study] Error initializing SRS:", error);
          });
      }

      setHasSaved(true);
    }
  }, [isCompleted, flashcards, vocabId, lessonId, lessonTitle, startTime, hasSaved, srsInitialized]);

  const proceedToNextCard = (newFlashcards: FlashcardData[], currentIdx: number) => {
    setTimeout(() => {
      const isAllKnown = newFlashcards.every((c) => c.status === "know");
      if (isAllKnown) {
        setIsCompleted(true);
        return;
      }

      let nextIndex = currentIdx + 1;
      while (nextIndex < newFlashcards.length && newFlashcards[nextIndex].status === "know") {
        nextIndex++;
      }

      if (nextIndex < newFlashcards.length) {
        setCurrentIndex(nextIndex);
      } else {
        let wrapIndex = 0;
        while (wrapIndex < newFlashcards.length && newFlashcards[wrapIndex].status === "know") {
          wrapIndex++;
        }
        setCurrentIndex(wrapIndex);
      }
    }, 200);
  };

  const handleMarkKnow = (id: string) => {
    setFlashcards((prev) => {
      const next = prev.map((card) =>
        card.id === id && card.status !== "know"
          ? { ...card, status: "know" as const }
          : card
      );
      proceedToNextCard(next, currentIndex);
      return next;
    });
  };

  const handleMarkStillLearning = (id: string) => {
    setFlashcards((prev) => {
      const next = prev.map((card) =>
        card.id === id && card.status !== "still_learning"
          ? { ...card, status: "still_learning" as const }
          : card
      );
      proceedToNextCard(next, currentIndex);
      return next;
    });
  };

  const handleReviewAgain = () => {
    if (lessonId) {
      setIsReviewModalOpen(true);
    } else {
      setFlashcards((prev) =>
        prev.map((card) => ({ ...card, status: null }))
      );
      setCurrentIndex(0);
      setIsCompleted(false);
    }
  };

  const handleTest = () => {
    if (lessonId) {
      navigate(`/test/${lessonId}`, { state: { from: fromPath } });
    }
  };

  const knowCount = flashcards.filter((card) => card.status === "know").length;
  const stillLearningCount = flashcards.filter(
    (card) => card.status !== "know"
  ).length;

  const progressPercent = ((knowCount) / flashcards.length) * 100;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-claude-border border-t-claude-accent mb-4"></div>
        <p className="text-claude-text-2 font-medium">Đang tải thẻ học...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-claude-error text-xl font-semibold mb-2">Lỗi tải dữ liệu</div>
        <p className="text-claude-text-2">{error}</p>
      </div>
    );
  }
  
  if (flashcards.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-claude-text-2">Không có thẻ nào để hiển thị.</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-4 animate-fade-in">
      <div className="mb-6 flex justify-start">
        <button
          onClick={() => navigate(fromPath)}
          className="text-claude-text-3 hover:text-claude-accent flex items-center gap-2 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Thoát
        </button>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-claude-text">Học Từ Mới</h1>
        {lessonTitle && <p className="text-claude-text-2 text-sm mt-1">{lessonTitle}</p>}
      </div>

      {isCompleted ? (
        <CompletionScreen
          flashcards={flashcards}
          onReviewAgain={handleReviewAgain}
          onTest={handleTest}
          onFinish={() => navigate(fromPath)}
          fromPath={fromPath}
        />
      ) : (
        <>
          <Flashcard
            key={flashcards[currentIndex].id}
            card={flashcards[currentIndex]}
            onMarkKnow={handleMarkKnow}
            onMarkStillLearning={handleMarkStillLearning}
          />
          <div className="mt-6 text-center">
            <div className="w-full max-w-md mx-auto">
              <div className="bg-claude-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-claude-accent h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
            <p className="mt-3 text-sm text-claude-text-2">
              Đã thuộc: <span className="font-bold text-claude-accent">{knowCount}</span> | Chưa thuộc: <span className="font-semibold text-claude-text-3">{stillLearningCount}</span>
            </p>
          </div>
        </>
      )}

      <ExerciseSelectionModal
        open={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        lessonId={lessonId || ""}
      />
    </div>
  );
};

export default Study;
