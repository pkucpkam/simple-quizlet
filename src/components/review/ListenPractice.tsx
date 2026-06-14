import { useState, useEffect, useRef, useCallback } from "react";
import { useSpeechSynthesis } from "../../hooks/useSpeechSynthesis";

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
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    speak({
      text: vocab.term,
      voice: selectedVoice,
      rate: 0.9,
      pitch: 1
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
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg px-6 py-8 relative overflow-hidden">
      <div className="text-center mb-10">
        <p className="text-gray-500 font-medium mb-3 uppercase tracking-wide text-sm">Nghe và Gõ lại</p>
        <div className="flex flex-col items-center justify-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl p-8 shadow-sm">
          <button
            onClick={handleSpeak}
            onMouseDown={(e) => e.preventDefault()}
            className="p-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors group shadow-sm hover:shadow-md active:scale-95"
            title="Phát âm"
            aria-label="Phát âm thuật ngữ"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-10 h-10 text-blue-600 group-hover:text-blue-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
              />
            </svg>
          </button>
          <p className="text-sm text-gray-500 font-medium mt-2">
            Nhấn hoặc <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-md text-xs mx-1">Ctrl</kbd> để nghe lại
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

            let borderColor = "border-gray-300";
            let textColor = "text-gray-800";
            let bgColor = "bg-white";

            if (showResult) {
              if (isCorrect) {
                borderColor = "border-green-500 bg-green-50";
                textColor = "text-green-700";
              } else {
                borderColor = "border-red-500 bg-red-50";
                textColor = "text-red-700";
              }
            } else if (index === userAnswer.length) {
              borderColor = "border-blue-500 ring-2 ring-blue-200";
            } else if (isRevealed && !userChar) {
              borderColor = "border-yellow-400";
              textColor = "text-yellow-600";
              bgColor = "bg-yellow-50";
            }

            return (
              <div
                key={index}
                className={`
                  w-10 h-12 md:w-12 md:h-14 
                  border-b-4 md:border-b-[4px] border-t-0 border-x-0 rounded-t-md text-3xl font-bold flex items-center justify-center transition-all duration-200
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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-center flex flex-col items-center">
            <p className={`text-xl font-bold mb-3 ${isCorrect ? "text-green-600" : "text-red-600"}`}>
              {isCorrect ? "🎉 Chính xác!" : "😔 Tiếc quá!"}
            </p>
            {!isCorrect && (
              <div className="flex flex-col items-center bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 w-full max-w-sm">
                <p className="text-sm text-gray-500 mb-1">Đáp án đúng:</p>
                <p className="font-bold text-gray-900 text-xl">{vocab.term}</p>
                <p className="text-gray-600 mt-2 text-sm italic border-t border-gray-200 pt-2 w-full text-center">
                  "{vocab.definition}"
                </p>
              </div>
            )}

            {!isCorrect && (
              <button
                onClick={onNext}
                className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
              >
                Tiếp theo
              </button>
            )}
          </div>
        ) : (
          <div className="flex w-full justify-between items-center px-4 md:px-10">
            <button
              type="button"
              onClick={handleHint}
              disabled={hints.size >= vocab.term.length - 1}
              className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-medium px-4 py-2 rounded-lg hover:bg-yellow-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={hints.size >= vocab.term.length - 1 ? "Không thể gợi ý hết toàn bộ từ" : "Hiển thị gợi ý một chữ cái"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Gợi ý ({Math.max(0, vocab.term.length - 1 - hints.size)})</span>
            </button>

            <button
              onClick={() => handleSubmit()}
              disabled={!userAnswer}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition transform active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Kiểm tra
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListenPractice;
