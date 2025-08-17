import { useState, useEffect, useRef } from "react";

interface PracticeCard {
  term: string;
  definition: string;
}

interface PracticeProps {
  vocab: PracticeCard;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  showResult: boolean;
}

const Practice: React.FC<PracticeProps> = ({ vocab, onAnswer, showResult }) => {
  const [userAnswer, setUserAnswer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && !showResult) {
      inputRef.current.focus();
    }
  }, [showResult]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const isCorrect = userAnswer.trim().toLowerCase() === vocab.term.toLowerCase();
    onAnswer(userAnswer, isCorrect);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg px-6 py-8">
      <div className="text-center mb-8">
        <p className="text-gray-600 mb-4">Nghĩa của từ này là gì?</p>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-2xl font-bold text-blue-800">{vocab.definition}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Nhập từ tiếng Anh..."
            className="w-full text-xl p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center"
            autoComplete="off"
            disabled={showResult}
          />
        </div>

        <button
          type="submit"
          disabled={!userAnswer.trim() || showResult}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          Kiểm tra (Enter)
        </button>
      </form>
    </div>
  );
};

export default Practice;
