import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { lessonService } from "../service/lessonService";

interface PracticeCard {
  id: string;
  term: string;
  definition: string;
  isCorrect?: boolean;
  userAnswer?: string;
}

interface PracticeStats {
  correct: number;
  incorrect: number;
  total: number;
}

const PracticeResultCard: React.FC<{
  card: PracticeCard;
  onNext: () => void;
  isLast: boolean;
}> = ({ card, onNext, isLast }) => {
  const isCorrect = card.isCorrect;
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className={`text-center p-4 rounded-lg mb-4 ${
        isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
      } border`}>
        <div className={`text-3xl mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {isCorrect ? '✓' : '✗'}
        </div>
        <p className={`text-lg font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
          {isCorrect ? 'Chính xác!' : 'Chưa đúng!'}
        </p>
      </div>

      <div className="text-center mb-4">
        <p className="text-gray-600 mb-2">Nghĩa:</p>
        <p className="text-xl font-semibold text-gray-800 mb-4">{card.definition}</p>
        
        <div className="space-y-2">
          <div>
            <span className="text-gray-600">Đáp án của bạn: </span>
            <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {card.userAnswer}
            </span>
          </div>
          {!isCorrect && (
            <div>
              <span className="text-gray-600">Đáp án đúng: </span>
              <span className="font-semibold text-green-600">{card.term}</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
      >
        {isLast ? 'Xem kết quả' : 'Tiếp tục'}
      </button>
    </div>
  );
};

const PracticeComplete: React.FC<{
  stats: PracticeStats;
  cards: PracticeCard[];
  onRestart: () => void;
  onBackToStudy: () => void;
}> = ({ stats, cards, onRestart, onBackToStudy }) => {
  const percentage = Math.round((stats.correct / stats.total) * 100);
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Hoàn thành bài ôn tập!</h2>
        <div className="text-6xl font-bold mb-4">
          <span className={percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
            {percentage}%
          </span>
        </div>
        <p className="text-xl text-gray-600">
          {stats.correct}/{stats.total} câu đúng
        </p>
      </div>

      {/* Chi tiết kết quả */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Chi tiết:</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {cards.map((card) => (
            <div key={card.id} className={`p-3 rounded-lg border ${
              card.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-medium">{card.definition}</span>
                <span className={`text-sm ${card.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {card.isCorrect ? '✓' : '✗'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                <span>Bạn trả lời: </span>
                <span className={card.isCorrect ? 'text-green-600' : 'text-red-600'}>
                  {card.userAnswer}
                </span>
                {!card.isCorrect && (
                  <>
                    <span> | Đúng: </span>
                    <span className="text-green-600">{card.term}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onRestart}
          className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
        >
          Ôn tập lại
        </button>
        <button
          onClick={onBackToStudy}
          className="py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
        >
          Về trang học
        </button>
      </div>
    </div>
  );
};

const Practice: React.FC = () => {
  const [cards, setCards] = useState<PracticeCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<PracticeStats>({ correct: 0, incorrect: 0, total: 0 });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const vocabId = location.state?.vocabId;
  const lessonId = location.state?.lessonId;
  const lessonTitle = location.state?.lessonTitle;
  const [] = useState(Date.now());

  useEffect(() => {
    const fetchVocab = async () => {
      if (!vocabId) {
        // Demo data nếu không có vocabId
        const demoCards = [
          { id: "1", term: "Apple", definition: "Táo" },
          { id: "2", term: "Book", definition: "Sách" },
          { id: "3", term: "House", definition: "Nhà" },
        ];
        setCards(demoCards);
        setStats({ correct: 0, incorrect: 0, total: demoCards.length });
        setLoading(false);
        return;
      }

      try {
        const vocabList = await lessonService.getVocabulary(vocabId);
        const practiceCards: PracticeCard[] = vocabList.map((vocab, index) => ({
          id: `${vocabId}-${index}`,
          term: vocab.word,
          definition: vocab.definition,
        }));
        
        // Shuffle cards để random thứ tự
        const shuffledCards = practiceCards.sort(() => Math.random() - 0.5);
        
        setCards(shuffledCards);
        setStats({ correct: 0, incorrect: 0, total: shuffledCards.length });
      } catch {
        setError("Không thể tải từ vựng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchVocab();
  }, [vocabId]);

  useEffect(() => {
    if (inputRef.current && !showResult && !isCompleted) {
      inputRef.current.focus();
    }
  }, [currentIndex, showResult, isCompleted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const currentCard = cards[currentIndex];
    const isCorrect = userAnswer.trim().toLowerCase() === currentCard.term.toLowerCase();
    
    // Update card với kết quả
    const updatedCard = {
      ...currentCard,
      isCorrect,
      userAnswer: userAnswer.trim()
    };
    
    setCards(prev => prev.map((card, index) => 
      index === currentIndex ? updatedCard : card
    ));

    // Update stats
    setStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer("");
      setShowResult(false);
    } else {
      // Hoàn thành bài ôn tập
      setIsCompleted(true);
    }
  };


  const handleRestart = () => {
    setCards(prev => prev.map(card => ({
      ...card,
      isCorrect: undefined,
      userAnswer: undefined
    })));
    setCurrentIndex(0);
    setUserAnswer("");
    setShowResult(false);
    setIsCompleted(false);
    setStats({ correct: 0, incorrect: 0, total: cards.length });
  };

  const handleBackToStudy = () => {
    navigate('/study', { 
      state: { vocabId, lessonId, lessonTitle }
    });
  };

  if (loading) return <div className="text-center mt-10">Đang tải bài ôn tập...</div>;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;
  if (cards.length === 0) return <div className="text-center mt-10">Không có từ vựng để ôn tập.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Ôn Tập Từ Vựng</h1>

        {isCompleted ? (
          <PracticeComplete
            stats={stats}
            cards={cards}
            onRestart={handleRestart}
            onBackToStudy={handleBackToStudy}
          />
        ) : showResult ? (
          <PracticeResultCard
            card={cards[currentIndex]}
            onNext={handleNext}
            isLast={currentIndex === cards.length - 1}
          />
        ) : (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Câu {currentIndex + 1}/{cards.length}</span>
                <span>{stats.correct} đúng | {stats.incorrect} sai</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">Nghĩa của từ này là gì?</p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                <p className="text-2xl font-bold text-blue-800">
                  {cards[currentIndex]?.definition}
                </p>
              </div>
            </div>

            {/* Answer Input */}
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <input
                  ref={inputRef}
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Nhập từ tiếng Anh..."
                  className="w-full text-xl p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center"
                  autoComplete="off"
                />
              </div>
              
              <button
                type="submit"
                disabled={!userAnswer.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Kiểm tra (Enter)
              </button>
            </form>

            <p className="text-sm text-gray-500 text-center mt-4">
              Nhập đáp án và nhấn Enter để kiểm tra
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Practice;