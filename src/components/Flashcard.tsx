import { useState, useEffect } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import Button from './ui/Button';
import { Volume2 } from 'lucide-react';

interface FlashcardData {
  id: string;
  term: string;
  definition: string;
  ipa?: string;
  wordType?: string;
  exampleEn?: string;
  exampleVi?: string;
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
    setIsFlipped(false);
  }, [card.id]);

  const handleFlip = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-full max-w-[400px] h-[240px] sm:max-w-[500px] sm:h-[300px] md:max-w-[600px] md:h-[360px] lg:max-w-[700px] lg:h-[420px] [perspective:1000px] cursor-pointer"
        onClick={handleFlip}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
        >
          {/* Front of card */}
          <div className="absolute w-full h-full bg-claude-surface border border-claude-border rounded-claude-lg shadow-claude-md flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 [backface-visibility:hidden] z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-claude-text text-center">{card.term}</h2>
            {card.wordType && (
              <span className="mt-2 mb-1 inline-block bg-claude-accent-light text-claude-accent text-[10px] sm:text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wider">
                {card.wordType}
              </span>
            )}
            {card.ipa && (
              <p className="mt-1 text-lg sm:text-xl text-claude-accent font-mono tracking-wide">{card.ipa}</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSpeak(card.term, true);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-claude-accent-lighter hover:bg-claude-accent-light transition-colors group"
              title="Phát âm"
              aria-label="Phát âm thuật ngữ"
            >
              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-claude-accent" />
            </button>
          </div>

          {/* Back of card */}
          <div className="absolute w-full h-full bg-claude-surface border border-claude-border rounded-claude-lg shadow-claude-md flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-lg sm:text-xl md:text-2xl text-claude-text font-bold text-center">{card.definition}</p>
            {card.exampleEn && (
              <div className="mt-6 text-center max-w-[90%] border-t border-claude-border pt-4">
                <p className="text-sm sm:text-base text-claude-text-2 italic leading-relaxed">"{card.exampleEn}"</p>
                {card.exampleVi && <p className="text-xs sm:text-sm text-claude-text-3 mt-2">{card.exampleVi}</p>}
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSpeak(card.definition, false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-claude-accent-lighter hover:bg-claude-accent-light transition-colors group"
              title="Phát âm"
              aria-label="Phát âm định nghĩa"
            >
              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-claude-accent" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 flex gap-4 w-full max-w-[400px] sm:max-w-[500px]">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onMarkStillLearning(card.id);
          }}
          variant="danger"
          size="lg"
          className="flex-1 py-3"
        >
          Chưa thuộc
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onMarkKnow(card.id);
          }}
          className="flex-1 py-3 bg-claude-success hover:bg-green-700 text-white shadow-claude-sm border border-transparent"
          size="lg"
        >
          Đã thuộc
        </Button>
      </div>
    </div>
  );
};

export default Flashcard;