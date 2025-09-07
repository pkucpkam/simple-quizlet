// LessonCard.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { Lesson } from "../types/lesson";
import ConfirmModal from "./common/ConfirmModal";

interface Props {
  lesson: Lesson;
  onDelete: (id: string) => Promise<void>;
  onTogglePrivacy: (id: string, isPrivate: boolean) => Promise<void>;
  onEdit?: (id: string) => void;
}

export default function LessonCard({ lesson, onDelete, onTogglePrivacy, onEdit }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<null | "delete" | "privacy">(null);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const storedUser = sessionStorage.getItem("user");
  const currentUsername = storedUser ? JSON.parse(storedUser).username : null;
  const isCreator = currentUsername === lesson.creator;

  const handleCardClick = () => {
    navigate(`/study/${lesson.id}`, { state: { vocabId: lesson.vocabId } });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <>
      <div
        className="w-full max-w-3xl bg-white shadow-md rounded-xl px-6 py-5 mx-auto flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:bg-blue-50"
        onClick={handleCardClick}
      >
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-blue-600">{lesson.title}</h2>
          <p className="text-gray-600 mt-1">{lesson.description}</p>
          <p className="text-sm text-gray-400 mt-1">Từ vựng: {lesson.wordCount} từ</p>
          <p className="text-sm text-gray-400 mt-1">Người tạo: {lesson.creator}</p>
          <p className="text-sm mt-1">
            {lesson.isPrivate ? (
              <span className="text-red-500">Riêng tư</span>
            ) : (
              <span className="text-green-600">Công khai</span>
            )}
          </p>
        </div>

        {isCreator && (
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 transition"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              title="Tùy chọn"
            >
              ⋮
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-10">
                {onEdit && (
                  <button
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      onEdit(lesson.id);
                      setIsMenuOpen(false);
                    }}
                  >
                    ✏️ Chỉnh sửa
                  </button>
                )}
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setConfirmType("privacy");
                    setIsMenuOpen(false);
                  }}
                >
                  {lesson.isPrivate ? "Chuyển công khai" : "Chuyển riêng tư"}
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                  onClick={() => {
                    setConfirmType("delete");
                    setIsMenuOpen(false);
                  }}
                >
                  Xoá
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmType === "delete"}
        title="Xác nhận xoá"
        message={`Bạn có chắc chắn muốn xoá bài học "${lesson.title}" không?`}
        onConfirm={async () => {
          try {
            await onDelete(lesson.id);
            toast.success(`Đã xoá bài học "${lesson.title}"`);
          } catch (error) {
            toast.error("Không thể xoá bài học. Vui lòng thử lại.");
          }
          setConfirmType(null);
        }}
        onCancel={() => setConfirmType(null)}
      />

      <ConfirmModal
        open={confirmType === "privacy"}
        title="Thay đổi quyền riêng tư"
        message={`Bạn có chắc chắn muốn ${lesson.isPrivate ? "chuyển công khai" : "chuyển riêng tư"} bài học "${lesson.title}" không?`}
        onConfirm={async () => {
          try {
            await onTogglePrivacy(lesson.id, !lesson.isPrivate);
            toast.success(`Bài học "${lesson.title}" đã được ${lesson.isPrivate ? "chuyển công khai" : "chuyển riêng tư"}`);
          } catch (error) {
            toast.error("Không thể cập nhật trạng thái bài học.");
          }
          setConfirmType(null);
        }}
        onCancel={() => setConfirmType(null)}
      />
    </>
  );
}