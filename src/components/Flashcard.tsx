import { useState, useEffect } from 'react';
import { useSpeechSynthesis } from 'react-speech-kit';

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
  const { speak } = useSpeechSynthesis();

  const handleSpeak = (text: string, isFront: boolean) => {
    const lang = isFront ? 'en' : 'vi';

    const voices = window.speechSynthesis.getVoices();

    const selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(lang));

    speak({
      text,
      voice: selectedVoice,
      rate: 0.9,
      pitch: 1
    });
  };

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
          className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
        >
          <div className="absolute w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center p-4 sm:p-6 md:p-8 [backface-visibility:hidden] z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{card.term}</h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSpeak(card.term, true);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors group"
              title="Phát âm"
              aria-label="Phát âm thuật ngữ"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 group-hover:text-blue-700"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                />
              </svg>
            </button>
          </div>
          <div className="absolute w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center p-4 sm:p-6 md:p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600">{card.definition}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSpeak(card.definition, false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors group"
              title="Phát âm"
              aria-label="Phát âm định nghĩa"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 group-hover:text-green-700"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                />
              </svg>
            </button>
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