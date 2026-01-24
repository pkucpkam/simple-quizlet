import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../service/firebase_setup";
import Flashcard from "../components/Flashcard";
import { lessonService } from "../service/lessonService";
import { historyService } from "../service/historyService";
import { srsService } from "../service/srsService";
import toast from "react-hot-toast";

interface FlashcardData {
  id: string;
  term: string;
  definition: string;
  status: "know" | "still_learning" | null;
}

const CompletionScreen: React.FC<{
  flashcards: FlashcardData[];
  onReviewAgain: () => void;
  onTest: () => void;
  onGoToDashboard: () => void;
}> = ({ flashcards, onReviewAgain, onTest, onGoToDashboard }) => {
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

      <div className="grid grid-cols-2 gap-4">
        <button
          className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          onClick={onReviewAgain}
        >
          Ôn tập lại
        </button>
        <button
          className="py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
          onClick={onTest}
        >
          Kiểm tra
        </button>
        <button
          className="py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold transition-colors col-span-2 shadow-lg"
          onClick={onGoToDashboard}
        >
          📊 Xem Dashboard & Ôn tập SRS
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
  const vocabId = location.state?.vocabId;
  const lessonId = location.state?.lessonId;
  const lessonTitle = location.state?.lessonTitle;
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetchVocab = async () => {
      if (!vocabId) {
        setFlashcards([
          { id: "1", term: "Apple", definition: "Táo", status: null },
          { id: "2", term: "Book", definition: "Sách", status: null },
          { id: "3", term: "House", definition: "Nhà", status: null },
        ]);
        setLoading(false);
        return;
      }

      try {
        const vocabList = await lessonService.getVocabulary(vocabId);
        const formattedFlashcards: FlashcardData[] = vocabList.map((vocab, index) => ({
          id: `${vocabId}-${index}`,
          term: vocab.word,
          definition: vocab.definition,
          status: null,
        }));
        setFlashcards(formattedFlashcards);
        sessionStorage.setItem("flashcards", JSON.stringify(formattedFlashcards));
      } catch {
        setError("Không thể tải từ vựng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchVocab();
  }, [vocabId]);

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
            console.log("[Study] SRS cards initialized!");
            toast.success("✨ Đã tạo SRS cards cho bài học này!");
            setSrsInitialized(true);
          })
          .catch((error) => {
            console.error("[Study] Error initializing SRS:", error);
          });
      }

      setHasSaved(true);
      console.log("[Study] Session saved!");
    }
  }, [isCompleted, flashcards, vocabId, lessonId, lessonTitle, startTime, hasSaved, srsInitialized]);

  const handleMarkKnow = (id: string) => {
    setFlashcards((prev) =>
      prev.map((card) =>
        card.id === id && card.status !== "know"
          ? { ...card, status: "know" }
          : card
      )
    );
    goToNextCard();
  };

  const handleMarkStillLearning = (id: string) => {
    setFlashcards((prev) =>
      prev.map((card) =>
        card.id === id && card.status !== "still_learning"
          ? { ...card, status: "still_learning" }
          : card
      )
    );
    goToNextCard();
  };

  const goToNextCard = () => {
    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsCompleted(true);
      }
    }, 200);
  };

  const handleReviewAgain = () => {
    setFlashcards((prev) =>
      prev.map((card) => ({ ...card, status: null }))
    );
    setCurrentIndex(0);
    setIsCompleted(false);
  };

  const handleTest = () => {
    console.log("[Study] Navigating to test mode");
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
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
          onGoToDashboard={handleGoToDashboard}
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
