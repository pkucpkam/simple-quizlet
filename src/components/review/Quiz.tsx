
import { useState, useEffect } from "react";

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
}, [term, definition]); 


  const handleSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    onAnswer(answer, answer === definition);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <p className="text-gray-600 mb-4 text-lg">Từ này có nghĩa là gì?</p>
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-200 rounded-lg p-8 mb-8">
          <p className="text-4xl font-bold text-purple-800">{term}</p>
        </div>
      </div>

      <div className="space-y-4">
        {options.map((option, idx) => {
          let baseClasses =
            "w-full p-4 text-left rounded-lg border-2 transition-all duration-200";
          let styleClasses =
            "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25 hover:shadow-md";


          if (showResult) {
            if (option === definition) {
              styleClasses = "border-green-400 bg-green-100 text-green-800";
            } else if (option === selectedAnswer && option !== definition) {
              styleClasses = "border-red-400 bg-red-100 text-red-800";
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
                <span className="text-lg font-medium">{option}</span>
                <span className="text-gray-400 font-bold text-xl">
                  {String.fromCharCode(65 + idx)}
                </span>
              </div>
            </button>
          );
        })}
      </div>  
      {showResult && selectedAnswer !== definition && (
        <div className="mt-6 text-center">
          <button
            onClick={onNext}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Tiếp theo
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
