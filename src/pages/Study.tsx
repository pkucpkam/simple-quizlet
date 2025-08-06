import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Flashcard from "../components/Flashcard";
import { lessonService } from "../service/lessonService"; 

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
  onAddNew: () => void;
}> = ({ flashcards, onReviewAgain, onTest, onAddNew }) => {
  const knowCount = flashcards.filter((card) => card.status === "know").length;
  const stillLearningCount = flashcards.filter((card) => card.status === "still_learning").length;

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Chúc mừng! Bạn đã học xong!</h2>
      <p className="text-lg text-gray-600 mb-2">Số từ đã thuộc: {knowCount}</p>
      <p className="text-lg text-gray-600 mb-6">Số từ cần ôn tập: {stillLearningCount}</p>
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
          className="py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors col-span-2"
          onClick={onAddNew}
        >
          Thêm thẻ mới
        </button>
      </div>
    </div>
  );
};

const Study: React.FC = () => {
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const vocabId = location.state?.vocabId;

  useEffect(() => {
    const fetchVocab = async () => {
      if (!vocabId) {
        console.log("[Study] No vocabId provided, using initial flashcards");
        setFlashcards([
          { id: "1", term: "Apple", definition: "Táo", status: null },
          { id: "2", term: "Book", definition: "Sách", status: null },
          { id: "3", term: "House", definition: "Nhà", status: null },
        ]);
        setLoading(false);
        return;
      }

      try {
        console.log("[Study] Fetching vocabulary for vocabId:", vocabId);
        const vocabList = await lessonService.getVocabulary(vocabId);
        const formattedFlashcards: FlashcardData[] = vocabList.map((vocab, index) => ({
          id: `${vocabId}-${index}`,
          term: vocab.word,
          definition: vocab.definition,
          status: null,
        }));
        setFlashcards(formattedFlashcards);
        sessionStorage.setItem("flashcards", JSON.stringify(formattedFlashcards));
        console.log("[Study] Loaded flashcards:", formattedFlashcards);
      } catch (err) {
        console.error("[Study] Error fetching vocabulary:", err);
        setError("Không thể tải từ vựng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchVocab();
  }, [vocabId]);

  useEffect(() => {
    if (flashcards.length > 0) {
      console.log("[Study] Saving flashcards to sessionStorage:", flashcards);
      sessionStorage.setItem("flashcards", JSON.stringify(flashcards));
    }
  }, [flashcards]);

  const handleMarkKnow = (id: string) => {
    setFlashcards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, status: "know" } : card
      )
    );
    goToNextCard();
    console.log("[Study] Marked card as know:", id);
  };

  const handleMarkStillLearning = (id: string) => {
    setFlashcards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, status: "still_learning" } : card
      )
    );
    goToNextCard();
    console.log("[Study] Marked card as still_learning:", id);
  };

  const goToNextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      console.log("[Study] Moved to next card, index:", currentIndex + 1);
    } else {
      console.log("[Study] Reached end of flashcards");
      setIsCompleted(true);
    }
  };


  const handleReviewAgain = () => {
    setCurrentIndex(0);
    setIsCompleted(false);
    console.log("[Study] Reviewing again");
  };

  const handleTest = () => {
    console.log("[Study] Navigating to test mode");
  
  };

  const handleAddNew = () => {
    console.log("[Study] Adding new flashcards");
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto p-4 text-center">
        <p className="text-lg text-gray-600">Đang tải thẻ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-screen-xl mx-auto p-4 text-center">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto p-4 text-center">
        <p className="text-lg text-gray-600">Không có thẻ để hiển thị.</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Học Từ Mới</h1>
      <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
        {["Thẻ ghi nhớ", "Học", "Kiểm tra", "Blocks", "Blast", "Ghép thẻ"].map((option) => (
          <button
            key={option}
            className={`py-2 px-2 h-16 rounded-lg font-medium text-white transition-colors flex justify-center items-center ${
              option === "Học"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
            onClick={() => console.log(`Chuyển đến chế độ: ${option}`)}
          >
            {option}
          </button>
        ))}
      </div>
      {isCompleted ? (
        <CompletionScreen
          flashcards={flashcards}
          onReviewAgain={handleReviewAgain}
          onTest={handleTest}
          onAddNew={handleAddNew}
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
              <div className="bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {currentIndex + 1} / {flashcards.length}
              </p>
            </div>
            <p>
              Đã thuộc: {flashcards.filter((card) => card.status === "know").length} | Chưa thuộc:{" "}
              {flashcards.filter((card) => card.status === "still_learning").length}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Study;