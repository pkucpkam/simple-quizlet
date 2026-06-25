import { useState, useEffect, useCallback } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import Button from './ui/Button';
import { Volume2, Zap, Sparkles } from 'lucide-react';

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
  const { speak, mode, setMode } = useSpeechSynthesis();

  const handleSpeak = useCallback((text: string, isFront: boolean) => {
    const lang = isFront ? 'en' : 'vi';
    speak({
      text,
      lang
    });
  }, [speak]);

  useEffect(() => {
    setIsFlipped(false);
  }, [card.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        event.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        onMarkKnow(card.id);
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        onMarkStillLearning(card.id);
      } else if (event.key === 'Control') {
        handleSpeak(isFlipped ? card.definition : card.term, !isFlipped);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [card.id, onMarkKnow, onMarkStillLearning, isFlipped, card.term, card.definition, handleSpeak]);

  const handleFlip = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[400px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] mb-6 flex justify-between items-center px-1">
        <div className="text-xs sm:text-sm font-semibold text-claude-text-3 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-claude-text-3" />
          Chế độ giọng đọc
        </div>
        <div className="flex items-center bg-claude-surface-2 p-1 rounded-claude-lg border border-claude-border shadow-inner">
          <button
            onClick={() => setMode('native')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all duration-300 select-none border border-b-2 ${
              mode === 'native' 
                ? 'bg-claude-surface text-amber-600 shadow-sm border-claude-border border-b-amber-500' 
                : 'text-claude-text-3 hover:text-claude-text hover:bg-black/5 border-transparent border-b-transparent'
            }`}
            title="Đọc ngay lập tức bằng giọng máy"
          >
            <Zap className={`w-3.5 h-3.5 ${mode === 'native' ? 'text-amber-500' : 'opacity-50'}`} />
            TỐC ĐỘ
          </button>
          <button
            onClick={() => setMode('google')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all duration-300 select-none border border-b-2 ${
              mode === 'google' 
                ? 'bg-claude-surface text-blue-600 shadow-sm border-claude-border border-b-blue-500' 
                : 'text-claude-text-3 hover:text-claude-text hover:bg-black/5 border-transparent border-b-transparent'
            }`}
            title="Đọc siêu mượt nhưng hơi chậm xíu"
          >
            <Sparkles className={`w-3.5 h-3.5 ${mode === 'google' ? 'text-blue-500' : 'opacity-50'}`} />
            TỰ NHIÊN
          </button>
        </div>
      </div>

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
          className="flex-1 py-3 flex flex-col items-center gap-1"
        >
          <span>Chưa thuộc</span>
          <span className="text-[10px] sm:text-xs opacity-70 font-normal"></span>
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onMarkKnow(card.id);
          }}
          className="flex-1 py-3 bg-claude-success hover:bg-green-700 text-white shadow-claude-sm border border-transparent flex flex-col items-center gap-1"
          size="lg"
        >
          <span>Đã thuộc</span>
          <span className="text-[10px] sm:text-xs opacity-70 font-normal"></span>
        </Button>
      </div>

      <div className="mt-8 text-claude-text-3 text-xs sm:text-sm flex flex-col items-center justify-center gap-2">
        <span>Nhấn <kbd className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-claude-border rounded-md text-[10px] sm:text-xs font-sans text-claude-text font-medium shadow-sm">Space</kbd> hoặc <kbd className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-claude-border rounded-md text-[10px] sm:text-xs font-sans text-claude-text font-medium shadow-sm">↑</kbd> để lật thẻ</span>
        <span className="mt-2">Nhấn <kbd className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-claude-border rounded-md text-[10px] sm:text-xs font-sans text-claude-text font-medium shadow-sm">Ctrl</kbd> để nghe phát âm</span>
      </div>
    </div>
  );
};

export default Flashcard;