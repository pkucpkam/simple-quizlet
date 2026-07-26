import { useState, useEffect, useRef, useCallback } from "react";
import { useSpeechSynthesis } from "../../hooks/useSpeechSynthesis";
import Button from "../ui/Button";
import { Volume2, Lightbulb } from "lucide-react";

interface ListenPracticeCard {
  term: string;
  definition: string;
}

interface ListenPracticeProps {
  vocab: ListenPracticeCard;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  showResult: boolean;
  onNext: () => void;
}

const ListenPractice: React.FC<ListenPracticeProps> = ({ vocab, onAnswer, showResult, onNext }) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hints, setHints] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const { speak } = useSpeechSynthesis();

  useEffect(() => {
    if (!showResult) {
      setUserAnswer("");
      setIsCorrect(null);
      setHints(new Set());
      setTimeout(() => inputRef.current?.focus(), 100);
      handleSpeak(); // Auto play when component loads
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocab, showResult]);

  useEffect(() => {
    if (showResult && isCorrect) {
      const timer = setTimeout(() => {
        onNext();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showResult, isCorrect, onNext]);

  const handleSpeak = useCallback(() => {
    speak({
      text: vocab.term,
      lang: 'en'
    });
  }, [vocab.term, speak]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        handleSpeak();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSpeak]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userAnswer.trim()) return;

    const correct = userAnswer.trim().toLowerCase() === vocab.term.toLowerCase();
    setIsCorrect(correct);
    onAnswer(userAnswer, correct);
  };

  const handleHint = () => {
    const termLength = vocab.term.length;

    if (hints.size >= termLength - 1) {
      return;
    }

    const unrevealedIndices: number[] = [];

    for (let i = 0; i < termLength; i++) {
      if (!hints.has(i)) {
        unrevealedIndices.push(i);
      }
    }

    if (unrevealedIndices.length > 0) {
      const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      setHints((prev) => {
        const newHints = new Set(prev);
        newHints.add(randomIndex);
        return newHints;
      });

      inputRef.current?.focus();
    }
  };

  const handleSlotClick = () => {
    inputRef.current?.focus();
  };

  const termChars = vocab.term.split('');

  return (
    <div className="max-w-2xl mx-auto bg-claude-surface border border-claude-border rounded-claude-lg shadow-claude px-6 py-8 relative overflow-hidden animate-fade-in">
      <div className="text-center mb-10">
        <p className="text-claude-text-3 font-bold mb-3 uppercase tracking-wide text-xs">Nghe và Gõ lại</p>
        <div className="flex flex-col items-center justify-center gap-4 bg-claude-accent-lighter border border-claude-accent-light rounded-claude-md p-8 shadow-claude-sm">
          <button
            onClick={handleSpeak}
            onMouseDown={(e) => e.preventDefault()}
            className="p-4 rounded-full bg-claude-accent-light hover:bg-amber-200 transition-colors group shadow-claude-sm active:scale-95"
            title="Phát âm"
            aria-label="Phát âm thuật ngữ"
            type="button"
          >
            <Volume2 className="w-10 h-10 text-claude-accent group-hover:text-claude-accent-2" />
          </button>
          <p className="text-sm text-claude-text-2 font-medium mt-2">
            Nhấn hoặc <kbd className="px-2 py-1 bg-claude-surface-2 border border-claude-border rounded-claude text-xs mx-1 text-claude-text">Ctrl</kbd> để nghe lại
          </p>
        </div>
      </div>

      <div className="mb-10 relative">
        <div
          className="flex flex-wrap justify-center gap-2 md:gap-3 cursor-text"
          onClick={handleSlotClick}
        >
          {termChars.map((char, index) => {
            const isRevealed = hints.has(index);
            const userChar = userAnswer[index] || "";
            const displayChar = userChar || (isRevealed ? char : "");

            let borderColor = "border-claude-border";
            let textColor = "text-claude-text";
            let bgColor = "bg-claude-surface";

            if (showResult) {
              if (isCorrect) {
                borderColor = "border-claude-success bg-claude-success-light";
                textColor = "text-claude-success";
              } else {
                borderColor = "border-claude-error bg-claude-error-light";
                textColor = "text-claude-error";
              }
            } else if (index === userAnswer.length) {
              borderColor = "border-claude-accent ring-2 ring-claude-accent-light";
            } else if (isRevealed && !userChar) {
              borderColor = "border-amber-400";
              textColor = "text-amber-700";
              bgColor = "bg-claude-accent-lighter";
            }

            return (
              <div
                key={index}
                className={`
                  w-10 h-12 md:w-12 md:h-14 
                  border-b-4 md:border-b-[4px] border-t-0 border-x-0 rounded-t-claude text-3xl font-bold flex items-center justify-center transition-all duration-150
                  ${borderColor} ${textColor} ${bgColor}
                  select-none
                `}
              >
                {displayChar}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => {
              if (e.target.value.length <= vocab.term.length) {
                setUserAnswer(e.target.value);
              }
            }}
            className="opacity-0 absolute top-0 left-0 w-full h-full cursor-text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            disabled={showResult}
          />
        </form>
      </div>

      <div className="flex flex-col items-center gap-4">
        {showResult && isCorrect !== null ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-center flex flex-col items-center space-y-4 w-full">
            <p className={`text-xl font-bold ${isCorrect ? "text-claude-success" : "text-claude-error"}`}>
              {isCorrect ? "🎉 Chính xác!" : "😔 Tiếc quá!"}
            </p>
            {!isCorrect && (
              <div className="flex flex-col items-center bg-claude-surface-2 rounded-claude-md p-4 border border-claude-border w-full max-w-sm shadow-claude-sm">
                <p className="text-xs text-claude-text-3 font-semibold mb-1 uppercase tracking-wider">Đáp án đúng:</p>
                <p className="font-bold text-claude-text text-xl">{vocab.term}</p>
                <p className="text-claude-text-2 mt-2 text-sm italic border-t border-claude-border pt-2 w-full text-center">
                  "{vocab.definition}"
                </p>
              </div>
            )}

            {!isCorrect && (
              <Button
                onClick={onNext}
                variant="primary"
                size="lg"
                className="px-8"
              >
                Tiếp theo
              </Button>
            )}
          </div>
        ) : (
          <div className="flex w-full justify-between items-center px-4 md:px-10">
            <button
              type="button"
              onClick={handleHint}
              disabled={hints.size >= vocab.term.length - 1}
              className="flex items-center gap-2 text-amber-700 hover:text-amber-800 font-semibold px-4 py-2 rounded-claude hover:bg-claude-accent-lighter transition disabled:opacity-50 disabled:cursor-not-allowed text-sm select-none"
              title={hints.size >= vocab.term.length - 1 ? "Không thể gợi ý hết toàn bộ từ" : "Hiển thị gợi ý một chữ cái"}
            >
              <Lightbulb className="h-5 w-5" />
              <span>Gợi ý ({Math.max(0, vocab.term.length - 1 - hints.size)})</span>
            </button>

            <Button
              onClick={() => handleSubmit()}
              disabled={!userAnswer}
              variant="primary"
              className="px-8"
            >
              Kiểm tra
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListenPractice;
