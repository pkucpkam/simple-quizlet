import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { auth } from "../service/firebase_setup";
import Flashcard from "../components/Flashcard";
import { lessonService, type VocabItem } from "../service/lessonService";
import { historyService } from "../service/historyService";
import { srsService } from "../service/srsService";
import toast from "react-hot-toast";

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

const CompletionScreen: React.FC<{
  flashcards: FlashcardData[];
  onReviewAgain: () => void;
  onTest: () => void;
}> = ({ flashcards, onReviewAgain, onTest }) => {
  const knowCount = flashcards.filter((card) => card.status === "know").length;
  const stillLearningCount = flashcards.filter((card) => card.status === "still_learning").length;

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Chúc mừng! Bạn đã học xong!</h2>
      <p className="text-lg text-gray-600 mb-2">Số từ đã thuộc: {knowCount}</p>
      <p className="text-lg text-gray-600 mb-6">Số từ cần ôn tập: {stillLearningCount}</p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 mb-2">✨ <strong>Đã tạo SRS cards!</strong></p>
        <p className="text-xs text-blue-600">Hệ thống sẽ tự động nhắc bạn ôn tập vào đúng thời điểm</p>
      </div>

      <div className="flex gap-4">
        <button
          className="flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-md"
          onClick={onReviewAgain}
        >
          🔄 Ôn tập lại (Review)
        </button>
        <button
          className="flex-1 py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors shadow-md"
          onClick={onTest}
        >
          📝 Kiểm tra (Test)
        </button>
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
          // Fallback demo data
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

  // Save study session and initialize SRS when completed
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
      const knowCount = flashcards.filter((card) => card.status === "know").length;

      // Save to study history
      historyService.saveStudySession(userId, {
        setId: vocabId || "",
        setName: lessonTitle || "Bài học không tên",
        lessonId: lessonId || "",
        lessonTitle: lessonTitle || "Bài học không tên",
        timeSpent,
        knowCount,
        totalCount: flashcards.length,
        studyMode: "flashcard",
      });

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
        // Wrap around to start and find first unmemorized card
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
      navigate(`/review/${lessonId}`);
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
      navigate(`/test/${lessonId}`);
    }
  };

  const knowCount = flashcards.filter((card) => card.status === "know").length;
  const stillLearningCount = flashcards.filter(
    (card) => card.status !== "know"
  ).length;

  const progressPercent = ((knowCount) / flashcards.length) * 100;

  if (loading) return <div className="text-center">Đang tải thẻ...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;
  if (flashcards.length === 0) return <div className="text-center">Không có thẻ để hiển thị.</div>;

  return (
    <div className="max-w-screen-xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Học Từ Mới</h1>

      {isCompleted ? (
        <CompletionScreen
          flashcards={flashcards}
          onReviewAgain={handleReviewAgain}
          onTest={handleTest}
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
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
            <p className="mt-2">
              Đã thuộc: {knowCount} | Chưa thuộc: {stillLearningCount}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Study;
