import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { lessonService } from "../service/lessonService";

interface MatchCard {
  id: string;
  content: string;
  type: 'term' | 'definition';
  matchId: string; // ID để ghép cặp
  isSelected: boolean;
  isMatched: boolean;
  isError: boolean;
}

interface MatchingStats {
  totalPairs: number;
  matchedPairs: number;
  attempts: number;
  timeSpent: number;
}

const MatchingComplete: React.FC<{
  stats: MatchingStats;
  onRestart: () => void;
  onBackToStudy: () => void;
}> = ({ stats, onRestart, onBackToStudy }) => {
  const accuracy = Math.round((stats.matchedPairs / stats.attempts) * 100);
  const timeInSeconds = Math.floor(stats.timeSpent / 1000);
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-green-600 mb-4">🎉 Hoàn thành!</h2>
        <p className="text-xl text-gray-600 mb-6">Bạn đã ghép thành công tất cả các cặp từ!</p>
        
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-600">{stats.totalPairs}</div>
            <div className="text-blue-700">Cặp từ</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-600">{stats.attempts}</div>
            <div className="text-green-700">Lần thử</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-yellow-600">{accuracy}%</div>
            <div className="text-yellow-700">Độ chính xác</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-purple-600">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-purple-700">Thời gian</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onRestart}
          className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
        >
          Chơi lại
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

const MatchingGame: React.FC = () => {
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MatchCard[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<MatchingStats>({
    totalPairs: 0,
    matchedPairs: 0,
    attempts: 0,
    timeSpent: 0
  });
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const vocabId = location.state?.vocabId;
  const lessonId = location.state?.lessonId;
  const lessonTitle = location.state?.lessonTitle;
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetchVocab = async () => {
      if (!vocabId) {
        // Demo data
        const demoData = [
          { word: "Apple", definition: "Táo" },
          { word: "Book", definition: "Sách" },
          { word: "House", definition: "Nhà" },
          { word: "Water", definition: "Nước" },
          { word: "Computer", definition: "Máy tính" },
          { word: "Phone", definition: "Điện thoại" }
        ];
        
        const matchCards = createMatchCards(demoData);
        setCards(matchCards);
        setStats(prev => ({ ...prev, totalPairs: demoData.length }));
        setLoading(false);
        return;
      }

      try {
        const vocabList = await lessonService.getVocabulary(vocabId);
        const matchCards = createMatchCards(vocabList.map(v => ({ word: v.word, definition: v.definition })));
        setCards(matchCards);
        setStats(prev => ({ ...prev, totalPairs: vocabList.length }));
      } catch {
        setError("Không thể tải từ vựng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchVocab();
  }, [vocabId]);

  const createMatchCards = (vocabData: { word: string; definition: string }[]): MatchCard[] => {
    const cards: MatchCard[] = [];
    
    vocabData.forEach((vocab, index) => {
      // Thẻ từ tiếng Anh
      cards.push({
        id: `term-${index}`,
        content: vocab.word,
        type: 'term',
        matchId: `pair-${index}`,
        isSelected: false,
        isMatched: false,
        isError: false
      });
      
      // Thẻ nghĩa tiếng Việt
      cards.push({
        id: `def-${index}`,
        content: vocab.definition,
        type: 'definition',
        matchId: `pair-${index}`,
        isSelected: false,
        isMatched: false,
        isError: false
      });
    });
    
    // Shuffle cards
    return cards.sort(() => Math.random() - 0.5);
  };

  const handleCardClick = (clickedCard: MatchCard) => {
    if (clickedCard.isMatched || clickedCard.isSelected) return;

    const newSelectedCards = [...selectedCards, clickedCard];
    
    // Update card selection state
    setCards(prev => prev.map(card => 
      card.id === clickedCard.id 
        ? { ...card, isSelected: true }
        : card
    ));

    if (newSelectedCards.length === 2) {
      const [firstCard, secondCard] = newSelectedCards;
      setStats(prev => ({ ...prev, attempts: prev.attempts + 1 }));

      if (firstCard.matchId === secondCard.matchId) {
        // Correct match
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.matchId === firstCard.matchId
              ? { ...card, isMatched: true, isSelected: false }
              : card
          ));
          
          setStats(prev => ({ 
            ...prev, 
            matchedPairs: prev.matchedPairs + 1 
          }));
          
          // Check if game is completed
          const remainingCards = cards.filter(card => 
            card.matchId !== firstCard.matchId && !card.isMatched
          );
          
          if (remainingCards.length === 0) {
            setTimeout(() => {
              setIsCompleted(true);
            }, 500);
          }
        }, 1000);
      } else {
        // Wrong match - show error
        setCards(prev => prev.map(card => 
          (card.id === firstCard.id || card.id === secondCard.id)
            ? { ...card, isError: true }
            : card
        ));
        
        // Reset after 1 second
        setTimeout(() => {
          setCards(prev => prev.map(card => ({
            ...card,
            isSelected: false,
            isError: false
          })));
        }, 1000);
      }
      
      setSelectedCards([]);
    } else {
      setSelectedCards(newSelectedCards);
    }
  };


  const handleRestart = () => {
    const resetCards = cards.map(card => ({
      ...card,
      isSelected: false,
      isMatched: false,
      isError: false
    })).sort(() => Math.random() - 0.5);
    
    setCards(resetCards);
    setSelectedCards([]);
    setIsCompleted(false);
    setStats({
      totalPairs: stats.totalPairs,
      matchedPairs: 0,
      attempts: 0,
      timeSpent: 0
    });
  };

  const handleBackToStudy = () => {
    navigate('/study', { 
      state: { vocabId, lessonId, lessonTitle }
    });
  };

  useEffect(() => {
    if (!isCompleted) {
      setStats(prev => ({ ...prev, timeSpent: Date.now() - startTime }));
    }
  }, [stats.matchedPairs, isCompleted, startTime]);

  if (loading) return <div className="text-center mt-10">Đang tải trò chơi ghép thẻ...</div>;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;
  if (cards.length === 0) return <div className="text-center mt-10">Không có từ vựng để ghép thẻ.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">Ghép Thẻ Từ Vựng</h1>
        <p className="text-center text-gray-600 mb-8">Ghép từ tiếng Anh với nghĩa tiếng Việt tương ứng</p>

        {isCompleted ? (
          <MatchingComplete
            stats={stats}
            onRestart={handleRestart}
            onBackToStudy={handleBackToStudy}
          />
        ) : (
          <>
            {/* Stats Header */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex space-x-6">
                  <div>
                    <span className="text-gray-600">Đã ghép: </span>
                    <span className="font-bold text-green-600">{stats.matchedPairs}/{stats.totalPairs}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Lần thử: </span>
                    <span className="font-bold text-blue-600">{stats.attempts}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Tiến độ</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(stats.matchedPairs / stats.totalPairs) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Board */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={card.isMatched || card.isSelected}
                  className={`
                    aspect-square p-4 rounded-lg border-2 font-medium text-center
                    transition-all duration-300 transform hover:scale-105
                    ${card.isMatched 
                      ? 'bg-green-100 border-green-300 text-green-800 cursor-default scale-95 opacity-75' 
                      : card.isError
                      ? 'bg-red-100 border-red-300 text-red-800 animate-pulse'
                      : card.isSelected
                      ? 'bg-blue-100 border-blue-400 text-blue-800 scale-105'
                      : card.type === 'term'
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
                      : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300'
                    }
                    ${card.isMatched ? '' : 'hover:shadow-md active:scale-95'}
                  `}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className={`
                      ${card.content.length > 10 ? 'text-sm' : 'text-base'}
                      ${card.content.length > 15 ? 'text-xs' : ''}
                      leading-tight
                    `}>
                      {card.content}
                    </span>
                  </div>
                  
                  {/* Type indicator */}
                  <div className={`
                    absolute top-1 right-1 w-3 h-3 rounded-full
                    ${card.type === 'term' ? 'bg-blue-400' : 'bg-purple-400'}
                  `}></div>
                </button>
              ))}
            </div>

            {/* Instructions */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Hướng dẫn:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>Thẻ màu xanh: Từ tiếng Anh</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span>Thẻ màu tím: Nghĩa tiếng Việt</span>
                </div>
                <p className="mt-2">Nhấn vào 2 thẻ để ghép chúng lại. Ghép đúng sẽ hiện màu xanh, ghép sai sẽ hiện màu đỏ và reset.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MatchingGame;