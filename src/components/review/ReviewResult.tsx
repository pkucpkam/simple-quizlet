import React from "react";
import Button from "../ui/Button";

interface ReviewResultProps {
  correctAnswers: number;
  totalQuestions: number;
  onRestart: () => void;
  fromPath: string;
  onBack: () => void;
}

const getBackLabel = (path: string) => {
  if (path === "/") return "🏠 Về trang chủ";
  if (path.startsWith("/folder/")) return "📁 Về thư mục";
  if (path.startsWith("/lesson/")) return "📖 Về bài học";
  if (path.startsWith("/study-history")) return "🕒 Về lịch sử";
  return "⬅️ Quay lại";
};

const ReviewResult: React.FC<ReviewResultProps> = ({
  correctAnswers,
  totalQuestions,
  onRestart,
  fromPath,
  onBack,
}) => {
  const accuracy = ((correctAnswers / totalQuestions) * 100).toFixed(0);
  const getEncouragementMessage = () => {
    const percentage = parseInt(accuracy);
    if (percentage >= 90) return "Tuyệt vời! Bạn gần như nắm vững hết rồi!";
    if (percentage >= 70) return "Rất tốt! Chỉ cần cố gắng một chút nữa thôi!";
    if (percentage >= 50) return "Khá ổn! Ôn tập thêm để đạt kết quả tốt hơn nhé!";
    return "Đừng nản! Hãy thử ôn tập lại để cải thiện nhé!";
  };

  return (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in">
      <div className="bg-claude-surface border border-claude-border rounded-claude-lg shadow-claude p-8 text-center">
        <h1 className="text-3xl font-bold text-claude-text mb-4">
          Hoàn thành ôn tập!
        </h1>
        <div className="mb-8 space-y-2">
          <p className="text-xl text-claude-text-2">
            Bạn đã trả lời đúng{" "}
            <span className="font-bold text-claude-accent">{correctAnswers}</span> / {totalQuestions} câu hỏi
          </p>
          <p className="text-xl text-claude-text-2">
            Tỷ lệ chính xác: <span className="font-bold text-claude-accent">{accuracy}%</span>
          </p>
          <p className="text-base text-claude-text-3 italic pt-2">{getEncouragementMessage()}</p>
        </div>
        <div className="flex justify-center gap-4">
          <Button
            onClick={onRestart}
            variant="primary"
            size="lg"
            className="px-8"
          >
            Ôn tập lại
          </Button>
          <Button
            onClick={onBack}
            variant="secondary"
            size="lg"
            className="px-8"
          >
            {getBackLabel(fromPath)}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewResult;