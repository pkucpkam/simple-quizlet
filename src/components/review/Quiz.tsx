import { useState, useEffect } from "react";
import Button from "../ui/Button";

interface QuizProps {
  term: string;
  definition: string;
  allDefinitions?: string[];
  onAnswer: (answer: string, isCorrect: boolean) => void;
  showResult: boolean;
  onNext?: () => void;
}

const Quiz: React.FC<QuizProps> = ({
  term,
  definition,
  allDefinitions = [],
  onAnswer,
  showResult,
  onNext,
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  const generateWrongOptions = (correctAnswer: string, allDefs: string[]) => {
    return allDefs
      .filter((def) => def !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  };

  useEffect(() => {
    const wrongOptions = generateWrongOptions(definition, allDefinitions);
    const shuffledOptions = [definition, ...wrongOptions]
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    setOptions(shuffledOptions);
    setSelectedAnswer("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const handleSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    onAnswer(answer, answer === definition);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (showResult) {
        if (e.key === 'Enter' && selectedAnswer !== definition && onNext) {
          e.preventDefault();
          onNext();
        }
        return;
      }

      const keyMap: Record<string, number> = {
        '1': 0,
        '2': 1,
        '3': 2,
        '4': 3,
      };

      const index = keyMap[e.key];
      if (index !== undefined && index < options.length) {
        e.preventDefault();
        handleSelect(options[index]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, showResult, definition, onAnswer, selectedAnswer, onNext]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-2xl mx-auto bg-claude-surface border border-claude-border rounded-claude-lg shadow-claude p-8 animate-fade-in">
      <div className="text-center mb-8">
        <p className="text-claude-text-2 mb-4 text-lg font-medium">Từ này có nghĩa là gì?</p>
        <div className="bg-claude-accent-lighter border-2 border-claude-accent-light rounded-claude-md p-8 mb-8">
          <p className="text-4xl font-bold text-claude-accent">{term}</p>
        </div>
      </div>

      <div className="space-y-4">
        {options.map((option, idx) => {
          const baseClasses =
            "w-full p-4 text-left rounded-claude border-2 transition-all duration-150 active:scale-[0.99]";
          let styleClasses =
            "border-claude-border bg-claude-surface hover:border-claude-accent hover:bg-claude-accent-lighter hover:shadow-claude-sm text-claude-text";

          if (showResult) {
            if (option === definition) {
              styleClasses = "border-claude-success bg-claude-success-light text-claude-success font-semibold";
            } else if (option === selectedAnswer && option !== definition) {
              styleClasses = "border-claude-error bg-claude-error-light text-claude-error font-semibold";
            } else {
              styleClasses = "border-claude-border bg-claude-surface opacity-50";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              className={`${baseClasses} ${styleClasses}`}
              disabled={showResult}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">{option}</span>
                <span className="text-claude-text-3 font-bold text-lg flex items-center gap-3">
                  <span className="text-[10px] font-normal bg-claude-border/50 px-1.5 py-0.5 rounded text-claude-text-2">Phím {idx + 1}</span>
                  {String.fromCharCode(65 + idx)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {showResult && selectedAnswer !== definition && (
        <div className="mt-6 text-center">
          <Button
            onClick={onNext}
            variant="primary"
            size="lg"
            className="px-8"
          >
            Tiếp theo
          </Button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
