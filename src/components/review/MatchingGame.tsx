import { useState, useEffect } from "react";

interface Vocab {
  term: string;
  definition: string;
}

interface MatchCard {
  id: string;
  content: string;
  type: 'term' | 'definition';
  matchId: string;
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

interface MatchingGameProps {
  vocabList: Vocab[];
  onAnswer: (answer: string, isCorrect: boolean) => void;
  showResult: boolean;
}


const MatchingGame: React.FC<MatchingGameProps> = ({ vocabList, onAnswer }) => {
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

  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (isCompleted) return;
    const createMatchCards = (vocabData: Vocab[]): MatchCard[] => {
      const cards: MatchCard[] = [];
      
      vocabData.forEach((vocab, index) => {
        cards.push({
          id: `term-${index}`,
          content: vocab.term,
          type: 'term',
          matchId: `pair-${index}`,
          isSelected: false,
          isMatched: false,
          isError: false
        });
        
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
      
      return cards.sort(() => Math.random() - 0.5);
    };

    setLoading(true);
    try {
      if (vocabList.length === 0) {
        throw new Error("Không có từ vựng để ghép thẻ.");
      }
      const matchCards = createMatchCards(vocabList);
      setCards(matchCards);
      setStats(prev => ({ ...prev, totalPairs: vocabList.length }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải từ vựng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [vocabList]);

  const handleCardClick = (clickedCard: MatchCard) => {
  if (clickedCard.isMatched || clickedCard.isSelected || isCompleted) return; 

  const newSelectedCards = [...selectedCards, clickedCard];
  
  setCards(prev => prev.map(card => 
    card.id === clickedCard.id 
      ? { ...card, isSelected: true }
      : card
  ));

  if (newSelectedCards.length === 2) {
    const [firstCard, secondCard] = newSelectedCards;
    setStats(prev => ({ ...prev, attempts: prev.attempts + 1 }));

    if (firstCard.matchId === secondCard.matchId) {
      setTimeout(() => {
  setCards(prev => {
    const newCards = prev.map(card => 
      card.matchId === firstCard.matchId
        ? { ...card, isMatched: true, isSelected: false }
        : card
    );

    const remainingCards = newCards.filter(card => !card.isMatched);
    console.log("Remaining cards:", remainingCards.length);

    if (remainingCards.length === 0) {
      console.log("Game completed!");
      setIsCompleted(true);
      onAnswer("matching", true); 
    }

    return newCards;
  });

  setStats(prev => ({ 
    ...prev, 
    matchedPairs: prev.matchedPairs + 1 
  }));
}, 300);

    } else {
      setCards(prev => prev.map(card => 
        (card.id === firstCard.id || card.id === secondCard.id)
          ? { ...card, isError: true }
          : card
      ));
      
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

  useEffect(() => {
    if (!isCompleted) {
      setStats(prev => ({ ...prev, timeSpent: Date.now() - startTime }));
    }
  }, [stats.matchedPairs, isCompleted, startTime]);

  if (loading) return <div className="text-center mt-10">Đang tải trò chơi ghép thẻ...</div>;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;
  if (cards.length === 0) return <div className="text-center mt-10">Không có từ vựng để ghép thẻ.</div>;

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-4 mb-4">
      <div className="max-w-6xl mx-auto px-4">  
        <p className="text-center text-gray-600 mb-4">Ghép từ tiếng Anh với nghĩa tiếng Việt tương ứng</p>
          <>
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-300">
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                  
                  <div className={`
                    absolute top-1 right-1 w-3 h-3 rounded-full
                    ${card.type === 'term' ? 'bg-blue-400' : 'bg-purple-400'}
                  `}></div>
                </button>
              ))}
            </div>

            <div className="mt-4 bg-white rounded-lg shadow-md p-4">
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
      </div>
    </div>
  );
};

export default MatchingGame;