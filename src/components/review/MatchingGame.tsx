import { useState, useEffect } from "react";
import Button from "../ui/Button";

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
  }, [vocabList, isCompleted]);

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

            if (remainingCards.length === 0) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-claude-border border-t-claude-accent mb-4"></div>
        <p className="text-claude-text-2 font-medium ml-3">Đang tải trò chơi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-claude-error font-medium p-8">
        {error}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center text-claude-text-3 font-medium p-8">
        Không có từ vựng để ghép thẻ.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-claude-surface border border-claude-border rounded-claude-lg shadow-claude p-4 md:p-6 mb-4 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <p className="text-claude-text-2 font-medium">Ghép từ tiếng Anh với nghĩa tiếng Việt tương ứng</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsCompleted(true);
              onAnswer("matching", true);
            }}
          >
            <span>Bỏ qua</span>
          </Button>
        </div>

        <>

          <div className="grid grid-cols-6 gap-2 sm:gap-4 max-w-5xl mx-auto">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={card.isMatched || card.isSelected}
                className={`
                    relative aspect-square p-4 rounded-claude border-2 font-semibold text-center
                    transition-all duration-200 transform active:scale-95
                    ${card.isMatched
                    ? 'opacity-0 pointer-events-none cursor-default'
                    : card.isError
                      ? 'bg-claude-error-light border-claude-error/30 text-claude-error animate-pulse'
                      : card.isSelected
                        ? 'bg-claude-accent-light border-claude-accent text-claude-accent scale-105 shadow-claude-sm'
                        : card.type === 'term'
                          ? 'bg-claude-surface border-claude-border text-claude-text hover:bg-claude-accent-lighter hover:border-claude-accent'
                          : 'bg-claude-surface-2 border-claude-border text-claude-text-2 hover:bg-claude-accent-lighter hover:border-claude-accent'
                  }
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
                    absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full
                    ${card.type === 'term' ? 'bg-claude-accent' : 'bg-claude-text-3'}
                  `}></div>
              </button>
            ))}
          </div>


        </>
      </div>
    </div>
  );
};

export default MatchingGame;