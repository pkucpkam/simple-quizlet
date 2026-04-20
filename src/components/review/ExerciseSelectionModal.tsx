import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
];

export default function ExerciseSelectionModal({ open, onClose, lessonId }: ExerciseSelectionModalProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["normal", "reverse", "practice", "matching"]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const toggleType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleStartReview = () => {
    if (selectedTypes.length === 0) return;
    const typesParam = selectedTypes.join(",");
    navigate(`/review/${lessonId}?types=${typesParam}`);
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white relative">
          <h2 className="text-2xl font-bold">🎯 Chọn chế độ ôn tập</h2>
          <p className="text-green-50 opacity-90 text-sm mt-1">Cá nhân hóa trải nghiệm học tập của bạn</p>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        <div className="p-6 md:p-8">
          {/* Main Review Options */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exerciseTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => toggleType(type.id)}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer group hover:shadow-md ${
                    selectedTypes.includes(type.id)
                      ? "border-green-500 bg-green-50"
                      : "border-gray-100 bg-white hover:border-green-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl bg-white p-2 rounded-xl shadow-sm border border-gray-50">
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold ${selectedTypes.includes(type.id) ? "text-green-700" : "text-gray-700"}`}>
                        {type.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedTypes.includes(type.id) 
                        ? "bg-green-500 border-green-500 text-white" 
                        : "border-gray-200"
                    }`}>
                      {selectedTypes.includes(type.id) && <span className="text-xs">✓</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleStartReview}
              disabled={selectedTypes.length === 0}
              className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-95 ${
                selectedTypes.length > 0
                  ? "bg-green-600 text-white hover:bg-green-700 shadow-green-200"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Bắt đầu Học ngay 🚀
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center">
          <p className="text-xs text-gray-400 font-medium">Học tập là chìa khóa của thành công ✨</p>
        </div>
      </div>
    </div>
  );
}
