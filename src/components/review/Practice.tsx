import { useState, useEffect, useRef } from "react";

interface PracticeCard {
  term: string;
  definition: string;
}

interface PracticeProps {
  vocab: PracticeCard;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  showResult: boolean;
  onNext: () => void;
}

const Practice: React.FC<PracticeProps> = ({ vocab, onAnswer, showResult, onNext }) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && !showResult) {
      inputRef.current.focus();
      setUserAnswer(""); // Đặt lại đáp án khi chuyển câu
      setIsCorrect(null); // Đặt lại trạng thái đúng/sai
    }
  }, [vocab, showResult]);

  useEffect(() => {
    if (showResult && isCorrect) {
      // Tự động chuyển câu sau 1 giây nếu trả lời đúng
      const timer = setTimeout(() => {
        onNext();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showResult, isCorrect, onNext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const correct = userAnswer.trim().toLowerCase() === vocab.term.toLowerCase();
    setIsCorrect(correct);
    onAnswer(userAnswer, correct);
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

        {showResult && isCorrect !== null ? (
          <div className="text-center">
            <p className={`text-xl font-bold mb-4 ${isCorrect ? "text-green-600" : "text-red-600"}`}>
              {isCorrect ? "Chính xác!" : `Sai rồi! Đáp án: ${vocab.term}`}
            </p>
            {!isCorrect && (
              <button
                type="button"
                onClick={onNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Tiếp theo
              </button>
            )}
          </div>
        ) : (
          <button
            type="submit"
            disabled={!userAnswer.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Kiểm tra (Enter)
          </button>
        )}
      </form>
    </div>
  );
};

export default Practice;