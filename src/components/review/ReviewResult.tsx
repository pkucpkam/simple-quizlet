import React from "react";

interface ReviewResultProps {
  correctAnswers: number;
  totalQuestions: number;
  onRestart: () => void;
}

const ReviewResult: React.FC<ReviewResultProps> = ({ correctAnswers, totalQuestions, onRestart }) => {
  const accuracy = ((correctAnswers / totalQuestions) * 100).toFixed(0);
  const getEncouragementMessage = () => {
    const percentage = parseInt(accuracy);
    if (percentage >= 90) return "Tuyệt vời! Bạn gần như nắm vững hết rồi!";
    if (percentage >= 70) return "Rất tốt! Chỉ cần cố gắng một chút nữa thôi!";
    if (percentage >= 50) return "Khá ổn! Ôn tập thêm để đạt kết quả tốt hơn nhé!";
    return "Đừng nản! Hãy thử ôn tập lại để cải thiện nhé!";
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Hoàn thành ôn tập!
        </h1>
        <div className="mb-6">
          <p className="text-2xl text-gray-700 mb-2">
            Bạn đã trả lời đúng{" "}
            <span className="font-bold text-blue-600">{correctAnswers}</span> / {totalQuestions} câu hỏi
          </p>
          <p className="text-2xl text-gray-700 mb-4">
            Tỷ lệ chính xác: <span className="font-bold text-blue-600">{accuracy}%</span>
          </p>
          <p className="text-xl text-gray-600 italic">{getEncouragementMessage()}</p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={onRestart}
            className="block rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Ôn tập lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewResult;