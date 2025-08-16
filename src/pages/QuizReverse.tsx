import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { lessonService } from "../service/lessonService";

interface QuizReverseCard {
  id: string;
  term: string;
  definition: string;
  options: string[];
  selectedAnswer?: string;
  isCorrect?: boolean;
}

interface QuizStats {
  correct: number;
  incorrect: number;
  total: number;
}

const QuizReverseResultCard: React.FC<{
  card: QuizReverseCard;
  onNext: () => void;
  isLast: boolean;
}> = ({ card, onNext, isLast }) => {
  const isCorrect = card.isCorrect;
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className={`text-center p-4 rounded-lg mb-6 ${
        isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
      } border`}>
        <div className={`text-4xl mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {isCorrect ? '✓' : '✗'}
        </div>
        <p className={`text-xl font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
          {isCorrect ? 'Chính xác!' : 'Chưa đúng!'}
        </p>
      </div>

      <div className="text-center mb-6">
        <p className="text-gray-600 mb-2">Nghĩa:</p>
        <p className="text-3xl font-bold text-blue-800 mb-6">{card.definition}</p>
        
        <div className="space-y-3">
          {card.options.map((option, index) => {
            let bgColor = 'bg-gray-50 border-gray-200';
            let textColor = 'text-gray-700';
            
            if (option === card.term) {
              // Đáp án đúng - luôn hiện màu xanh
              bgColor = 'bg-green-100 border-green-300';
              textColor = 'text-green-800';
            } else if (option === card.selectedAnswer && !card.isCorrect) {
              // Đáp án sai được chọn - hiện màu đỏ
              bgColor = 'bg-red-100 border-red-300';
              textColor = 'text-red-800';
            }
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${bgColor} ${textColor}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg">{option}</span>
                  {option === card.term && (
                    <span className="text-green-600 font-bold">✓ Đúng</span>
                  )}
                  {option === card.selectedAnswer && !card.isCorrect && (
                    <span className="text-red-600 font-bold">✗ Bạn chọn</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
      >
        {isLast ? 'Xem kết quả' : 'Câu tiếp theo'}
      </button>
    </div>
  );
};

const QuizReverseComplete: React.FC<{
  stats: QuizStats;
  cards: QuizReverseCard[];
  onRestart: () => void;
  onBackToStudy: () => void;
}> = ({ stats, cards, onRestart, onBackToStudy }) => {
  const percentage = Math.round((stats.correct / stats.total) * 100);
  
  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return "Xuất sắc! 🎉";
    if (percentage >= 80) return "Tốt lắm! 👏";
    if (percentage >= 70) return "Khá tốt! 👍";
    if (percentage >= 60) return "Cần cố gắng thêm! 💪";
    return "Hãy ôn tập thêm nhé! 📚";
  };
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          {getPerformanceMessage(percentage)}
        </h2>
        <div className="text-7xl font-bold mb-4">
          <span className={
            percentage >= 80 ? 'text-green-600' : 
            percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
          }>
            {percentage}%
          </span>
        </div>
        <p className="text-2xl text-gray-600">
          {stats.correct}/{stats.total} câu đúng
        </p>
      </div>

      {/* Biểu đồ thống kê */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.correct}</div>
          <div className="text-green-700">Câu đúng</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{stats.incorrect}</div>
          <div className="text-red-700">Câu sai</div>
        </div>
      </div>

      {/* Chi tiết từng câu */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Chi tiết kết quả:</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {cards.map((card) => (
            <div key={card.id} className={`p-4 rounded-lg border ${
              card.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg">{card.definition}</span>
                <span className={`text-2xl ${card.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {card.isCorrect ? '✓' : '✗'}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600">Đáp án đúng: </span>
                  <span className="font-medium text-green-600">{card.term}</span>
                </div>
                {!card.isCorrect && (
                  <div>
                    <span className="text-gray-600">Bạn chọn: </span>
                    <span className="font-medium text-red-600">{card.selectedAnswer}</span>
                  </div>
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
          Làm lại bài quiz
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

const QuizReverse: React.FC = () => {
  const [cards, setCards] = useState<QuizReverseCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<QuizStats>({ correct: 0, incorrect: 0, total: 0 });
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const vocabId = location.state?.vocabId;
  const lessonId = location.state?.lessonId;
  const lessonTitle = location.state?.lessonTitle;
  const [] = useState(Date.now());

  // Tạo các lựa chọn từ tiếng Anh sai ngẫu nhiên
  const generateWrongOptions = (correctAnswer: string, allTerms: string[]): string[] => {
    const wrongOptions = allTerms
      .filter(term => term !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    // Nếu không đủ 3 lựa chọn sai, thêm một số từ mặc định
    const defaultWrongOptions = [
      "Computer", "Table", "Window", "Phone", "Book",
      "Bicycle", "Television", "Clothes", "Shoes", "Bag",
      "Water", "House", "Car", "Tree", "Flower"
    ];
    
    while (wrongOptions.length < 3) {
      const randomOption = defaultWrongOptions[Math.floor(Math.random() * defaultWrongOptions.length)];
      if (!wrongOptions.includes(randomOption) && randomOption !== correctAnswer) {
        wrongOptions.push(randomOption);
      }
    }
    
    return wrongOptions;
  };

  useEffect(() => {
    const fetchVocab = async () => {
      if (!vocabId) {
        // Demo data nếu không có vocabId
        const demoData = [
          { word: "Apple", definition: "Táo" },
          { word: "Book", definition: "Sách" },
          { word: "House", definition: "Nhà" },
          { word: "Water", definition: "Nước" },
          { word: "Computer", definition: "Máy tính" }
        ];
        
        const allTerms = demoData.map(item => item.word);
        
        const quizCards: QuizReverseCard[] = demoData.map((vocab, index) => {
          const wrongOptions = generateWrongOptions(vocab.word, allTerms);
          const allOptions = [vocab.word, ...wrongOptions].sort(() => Math.random() - 0.5);
          
          return {
            id: `demo-${index}`,
            term: vocab.word,
            definition: vocab.definition,
            options: allOptions,
          };
        });
        
        setCards(quizCards);
        setStats({ correct: 0, incorrect: 0, total: quizCards.length });
        setLoading(false);
        return;
      }

      try {
        const vocabList = await lessonService.getVocabulary(vocabId);
        const allTerms = vocabList.map(vocab => vocab.word);
        
        const quizCards: QuizReverseCard[] = vocabList.map((vocab, index) => {
          const wrongOptions = generateWrongOptions(vocab.word, allTerms);
          const allOptions = [vocab.word, ...wrongOptions].sort(() => Math.random() - 0.5);
          
          return {
            id: `${vocabId}-${index}`,
            term: vocab.word,
            definition: vocab.definition,
            options: allOptions,
          };
        });
        
        // Shuffle cards để random thứ tự
        const shuffledCards = quizCards.sort(() => Math.random() - 0.5);
        
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

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return; // Không cho chọn nếu đã hiển thị kết quả
    
    setSelectedAnswer(answer);
    
    const currentCard = cards[currentIndex];
    const isCorrect = answer === currentCard.term;
    
    // Update card với kết quả
    const updatedCard = {
      ...currentCard,
      selectedAnswer: answer,
      isCorrect
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

    // Hiển thị kết quả sau 300ms
    setTimeout(() => {
      setShowResult(true);
    }, 300);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer("");
      setShowResult(false);
    } else {
      // Hoàn thành bài quiz
      setIsCompleted(true);
    }
  };


  const handleRestart = () => {
    setCards(prev => prev.map(card => ({
      ...card,
      selectedAnswer: undefined,
      isCorrect: undefined
    })));
    setCurrentIndex(0);
    setSelectedAnswer("");
    setShowResult(false);
    setIsCompleted(false);
    setStats({ correct: 0, incorrect: 0, total: cards.length });
  };

  const handleBackToStudy = () => {
    navigate('/study', { 
      state: { vocabId, lessonId, lessonTitle }
    });
  };

  if (loading) return <div className="text-center mt-10">Đang tải bài quiz...</div>;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;
  if (cards.length === 0) return <div className="text-center mt-10">Không có từ vựng để quiz.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">Quiz Từ Vựng</h1>
        <p className="text-center text-gray-600 mb-8">Chọn từ tiếng Anh tương ứng với nghĩa</p>

        {isCompleted ? (
          <QuizReverseComplete
            stats={stats}
            cards={cards}
            onRestart={handleRestart}
            onBackToStudy={handleBackToStudy}
          />
        ) : showResult ? (
          <QuizReverseResultCard
            card={cards[currentIndex]}
            onNext={handleNext}
            isLast={currentIndex === cards.length - 1}
          />
        ) : (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Câu {currentIndex + 1}/{cards.length}</span>
                <span>{stats.correct} đúng | {stats.incorrect} sai</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4 text-lg">Từ tiếng Anh nào có nghĩa là:</p>
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-200 rounded-lg p-8 mb-8">
                <p className="text-4xl font-bold text-purple-800">
                  {cards[currentIndex]?.definition}
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              {cards[currentIndex]?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    selectedAnswer === option
                      ? 'border-purple-500 bg-purple-50 text-purple-800 transform scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25 hover:shadow-md'
                  }`}
                  disabled={showResult}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">{option}</span>
                    <span className="text-gray-400 font-bold text-xl">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500 text-center mt-6">
              Chọn từ tiếng Anh có nghĩa tương ứng
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizReverse;