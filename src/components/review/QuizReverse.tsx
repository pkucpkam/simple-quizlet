import { useEffect, useState } from "react";

interface QuizReverseProps {
  vocab: { term: string; definition: string };
  allVocabs: { term: string; definition: string }[];
  onAnswer: (answer: string, isCorrect: boolean) => void;
  showResult: boolean;
}

const QuizReverse: React.FC<QuizReverseProps> = ({ vocab, allVocabs, onAnswer, showResult }) => {
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    const wrongOptions = allVocabs
      .map((v) => v.term)
      .filter((t) => t !== vocab.term)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allOptions = [vocab.term, ...wrongOptions].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  }, [vocab]);

  const handleSelect = (answer: string) => {
    if (showResult) return;
    const isCorrect = answer === vocab.term;
    onAnswer(answer, isCorrect);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <p className="text-gray-600 mb-4 text-lg">Từ tiếng Anh nào có nghĩa là:</p>
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-200 rounded-lg p-8 mb-8">
          <p className="text-4xl font-bold text-purple-800">{vocab.definition}</p>
        </div>
      </div>

      <div className="space-y-4">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option)}
            className="w-full p-4 text-left rounded-lg border-2 border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">{option}</span>
              <span className="text-gray-400 font-bold text-xl">
                {String.fromCharCode(65 + index)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizReverse;
