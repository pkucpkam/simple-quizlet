import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import type { Lesson } from "../types/lesson";

interface Props {
  lesson: Lesson;
  onView?: (id: string) => void; 
  onPractice?: (id: string) => void; 
  onDelete: (id: string) => void;
  onSave?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function LessonCard({ lesson, onDelete, onSave, onEdit }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate(); 

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCardClick = () => {
    navigate(`/study/${lesson.id}`, { state: { vocabId: lesson.vocabId } });
  };

  return (
    <div
      className="w-full max-w-3xl bg-white shadow-md rounded-xl px-6 py-5 mx-auto flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:bg-blue-50"
      onClick={handleCardClick} 
    >
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-blue-600">{lesson.title}</h2>
        <p className="text-gray-600 mt-1">{lesson.description}</p>
        <p className="text-sm text-gray-400 mt-1">Từ vựng: {lesson.wordCount} từ</p>
        <p className="text-sm text-gray-400 mt-1">Người tạo: {lesson.creator}</p>
      </div>

      <div className="flex items-center gap-2 justify-end relative" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button
            className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 transition"
            onClick={toggleMenu}
            title="Thêm tùy chọn"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-10">
              <button
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  if (onSave) onSave(lesson.id);
                  setIsMenuOpen(false);
                }}
              >
                Lưu
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  if (onEdit) onEdit(lesson.id);
                  setIsMenuOpen(false);
                }}
              >
                Chỉnh sửa
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                onClick={() => {
                  onDelete(lesson.id);
                  setIsMenuOpen(false);
                }}
              >
                Xoá
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}