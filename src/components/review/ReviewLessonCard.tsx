import { useState } from "react";
import type { Lesson } from "../../types/lesson";
import ExerciseSelectionModal from "./ExerciseSelectionModal";

interface Props {
  lesson: Lesson;
  onDelete: (id: string) => void;
  onSave?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function ReviewLessonCard({ lesson }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = async () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className="w-full max-w-3xl bg-claude-surface border border-claude-border shadow-claude-sm rounded-claude-md px-6 py-5 mx-auto flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:shadow-claude transition-all duration-200 hover:bg-claude-surface-2"
        onClick={handleCardClick} 
      >
        <div className="flex-1">
          <h2 className="text-xl font-bold text-claude-accent">{lesson.title}</h2>
          {lesson.description && <p className="text-claude-text-2 mt-1">{lesson.description}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-claude-text-3 font-medium">
            <span>📚 Từ vựng: {lesson.wordCount} từ</span>
            <span>👤 Người tạo: {lesson.creator}</span>
          </div>
        </div>
      </div>
      <ExerciseSelectionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lessonId={lesson.id}
      />
    </>
  );
}
