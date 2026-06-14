import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

interface ExerciseSelectionModalProps {
  open: boolean;
  onClose: () => void;
  lessonId: string;
}

const exerciseTypes = [
  { id: "normal", name: "Trắc nghiệm", description: "Chọn nghĩa đúng cho từ vựng", icon: "✅" },
  { id: "reverse", name: "Trắc nghiệm ngược", description: "Chọn từ vựng cho nghĩa đúng", icon: "🔄" },
  { id: "practice", name: "Gõ lại", description: "Gõ từ vựng theo nghĩa", icon: "⌨️" },
  { id: "matching", name: "Ghép thẻ", description: "Ghép từ và nghĩa tương ứng", icon: "🧩" },
  { id: "listen", name: "Nghe và gõ", description: "Nghe từ vựng và gõ lại", icon: "🎧" },
];

export default function ExerciseSelectionModal({ open, onClose, lessonId }: ExerciseSelectionModalProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["normal", "reverse", "practice", "matching", "listen"]);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleStartReview = () => {
    if (selectedTypes.length === 0) return;
    const typesParam = selectedTypes.join(",");
    navigate(`/review/${lessonId}?types=${typesParam}`, { state: { from: location.pathname } });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🎯 Chọn chế độ ôn tập"
      size="lg"
    >
      <div className="space-y-6">
        <p className="text-sm text-claude-text-2">
          Cá nhân hóa trải nghiệm học tập của bạn bằng cách chọn các dạng bài tập muốn ôn luyện.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exerciseTypes.map((type) => {
            const isSelected = selectedTypes.includes(type.id);
            return (
              <div
                key={type.id}
                onClick={() => toggleType(type.id)}
                className={`relative p-4 rounded-claude-md border-2 transition-all cursor-pointer group hover:shadow-claude-sm ${
                  isSelected
                    ? "border-claude-accent bg-claude-accent-lighter"
                    : "border-claude-border bg-claude-surface hover:border-claude-border-strong"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl bg-claude-surface-2 p-2 rounded-claude border border-claude-border">
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold ${isSelected ? "text-claude-accent" : "text-claude-text"}`}>
                      {type.name}
                    </h4>
                    <p className="text-xs text-claude-text-2 mt-1">{type.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-claude-accent border-claude-accent text-white"
                      : "border-claude-border bg-claude-surface"
                  }`}>
                    {isSelected && <span className="text-xs">✓</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleStartReview}
          disabled={selectedTypes.length === 0}
          variant="primary"
          className="w-full py-3 text-base font-bold"
        >
          Bắt đầu Học ngay 🚀
        </Button>
        
        <p className="text-xs text-center text-claude-text-3 font-medium border-t border-claude-border pt-4">
          Học tập là chìa khóa của thành công ✨
        </p>
      </div>
    </Modal>
  );
}
