import { useState, useEffect } from "react";

interface QuizCard {
  id: string;
  term: string;
  definition: string;
  options: string[];
  selectedAnswer?: string;
  isCorrect?: boolean;
}

interface QuizProps {
  term: string;
  definition: string;
  allDefinitions?: string[];
  onAnswer: (answer: string, isCorrect: boolean) => void;
  showResult: boolean;
}

const QuizResultCard: React.FC<{
  card: QuizCard;
}> = ({ card }) => {
  const isCorrect = card.isCorrect;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div
        className={`text-center p-4 rounded-lg border ${isCorrect
            ? "bg-green-100 border-green-300"
            : "bg-red-100 border-red-300"
          }`}
      >
        <div
          className={`text-4xl mb-2 ${isCorrect ? "text-green-600" : "text-red-600"
            }`}
        >
          {isCorrect ? "✓" : "✗"}
        </div>
        <p
          className={`text-xl font-bold ${isCorrect ? "text-green-800" : "text-red-800"
            }`}
        >
          {isCorrect ? "Chính xác!" : "Sai mất rồi!"}
        </p>
      </div>

      <div className="text-center mb-6">
        <p className="text-gray-600 mb-2">Từ vựng:</p>
        <p className="text-3xl font-bold text-purple-800 mb-6">{card.term}</p>

        <div className="space-y-3">
          {card.options.map((option, index) => {
            let bgColor = "bg-gray-50 border-gray-200";
            let textColor = "text-gray-700";

            if (option === card.definition) {
              bgColor = "bg-green-100 border-green-300";
              textColor = "text-green-800";
            } else if (option === card.selectedAnswer && !card.isCorrect) {
              bgColor = "bg-red-100 border-red-300";
              textColor = "text-red-800";
            }

            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${bgColor} ${textColor}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {option === card.definition && (
                    <span className="text-green-600 font-bold">✓ Đúng</span>
                  )}
                  {option === card.selectedAnswer && !card.isCorrect && (
                    <span className="text-red-600 font-bold">✗ Bạn chọn</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Quiz: React.FC<QuizProps> = ({ 
  term, 
  definition, 
  allDefinitions = [], 
  onAnswer, 
  showResult 
}) => {
  const [card, setCard] = useState<QuizCard | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  const generateWrongOptions = (correctAnswer: string, allDefs: string[]) => {
    const wrongFromList = allDefs
      .filter(def => def !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const defaults = ["Máy tính", "Cửa sổ", "Quần áo", "Xe đạp", "Điện thoại", "Bàn ghế", "Cây cối"];
    const wrongOptions = [...wrongFromList];

    while (wrongOptions.length < 3) {
      const opt = defaults[Math.floor(Math.random() * defaults.length)];
      if (!wrongOptions.includes(opt) && opt !== correctAnswer) {
        wrongOptions.push(opt);
      }
    }
    
    return wrongOptions.slice(0, 3);
  };

  useEffect(() => {
    setSelectedAnswer("");
    
    const wrongOptions = generateWrongOptions(definition, allDefinitions);
    const options = [definition, ...wrongOptions].sort(() => Math.random() - 0.5);
    
    setCard({
      id: `quiz-${term}`,
      term,
      definition,
      options,
    });
  }, [term, definition, allDefinitions]);

  const handleAnswerSelect = (answer: string) => {
    if (showResult || !card) return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === card.definition;
    
    setCard({ ...card, selectedAnswer: answer, isCorrect });
    onAnswer(answer, isCorrect);
  };

  if (!card) return <div className="text-center">Đang tải...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      {showResult ? (
        <QuizResultCard card={card} />
      ) : (
        <>
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-4 text-lg">Từ này có nghĩa là gì?</p>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-200 rounded-lg p-8 mb-8">
              <p className="text-4xl font-bold text-purple-800">{card.term}</p>
            </div>
          </div>

          <div className="space-y-4">
            {card.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  selectedAnswer === option
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25 hover:shadow-md"
                }`}
                disabled={showResult}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">{option}</span>
                  <span className="text-gray-400 font-bold text-xl">
                    {String.fromCharCode(65 + idx)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Quiz;