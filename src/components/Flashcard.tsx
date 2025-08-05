import { useState, useEffect } from 'react';

interface FlashcardData {
  id: string;
  term: string;
  definition: string;
  status: 'know' | 'still_learning' | null;
}

interface FlashcardProps {
  card: FlashcardData;
  onMarkKnow: (id: string) => void;
  onMarkStillLearning: (id: string) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ card, onMarkKnow, onMarkStillLearning }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    console.log('[Flashcard] Card changed, resetting isFlipped. Card ID:', card.id);
    setIsFlipped(false);
  }, [card.id]);

  const handleFlip = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsFlipped((prev) => {
      console.log('[Flashcard] Toggling isFlipped from', prev, 'to', !prev, 'for card:', card.id);
      return !prev;
    });
  };

  console.log('[Flashcard] Rendering card:', card, 'isFlipped:', isFlipped);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-full max-w-[400px] h-[240px] sm:max-w-[500px] sm:h-[300px] md:max-w-[600px] md:h-[360px] lg:max-w-[700px] lg:h-[420px] [perspective:1000px] cursor-pointer"
        onClick={handleFlip}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* Mặt trước (Thuật ngữ) */}
          <div className="absolute w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center p-4 sm:p-6 md:p-8 [backface-visibility:hidden] z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{card.term}</h2>
          </div>
          {/* Mặt sau (Định nghĩa) */}
          <div className="absolute w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center p-4 sm:p-6 md:p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600">{card.definition}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 sm:mt-6 md:mt-8 flex gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('[Flashcard] Marking still_learning for card:', card.id);
            onMarkStillLearning(card.id);
          }}
          className="px-4 py-2 sm:px-5 sm:py-3 bg-red-600 text-white rounded hover:bg-red-700 text-base sm:text-lg md:text-xl"
        >
          Chưa thuộc
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('[Flashcard] Marking know for card:', card.id);
            onMarkKnow(card.id);
          }}
          className="px-4 py-2 sm:px-5 sm:py-3 bg-green-600 text-white rounded hover:bg-green-700 text-base sm:text-lg md:text-xl"
        >
          Đã thuộc
        </button>
      </div>
    </div>
  );
};

export default Flashcard;