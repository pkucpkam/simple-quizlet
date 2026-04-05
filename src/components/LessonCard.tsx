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
  onFolderAction?: (id: string) => void;
  folderActionLabel?: string;
  folderActionIcon?: string;
}

export default function LessonCard({ 
  lesson, 
  onDelete, 
  onTogglePrivacy, 
  onEdit,
  onFolderAction,
  folderActionLabel,
  folderActionIcon = "📁"
}: Props) {
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
        className="w-full h-full bg-white shadow-md hover:shadow-xl rounded-2xl px-6 py-6 flex flex-col gap-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50/30 border border-gray-100"
        onClick={handleCardClick}
      >
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800 line-clamp-2 leading-tight hover:text-blue-600 transition-colors flex-1">
              {lesson.title}
            </h2>
            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {onFolderAction && (
                <button
                  onClick={() => onFolderAction(lesson.id)}
                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
                  title={folderActionLabel}
                >
                  <span className="text-lg">{folderActionIcon}</span>
                </button>
              )}

              {isCreator && (
                <div className="relative" ref={menuRef}>
                  <button
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors shadow-sm"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    title="Tùy chọn"
                  >
                    <span className="text-xl">⋮</span>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden z-20 py-1.5 animate-in fade-in zoom-in duration-200">
                      {onEdit && (
                        <button
                          className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors font-medium"
                          onClick={() => {
                            onEdit(lesson.id);
                            setIsMenuOpen(false);
                          }}
                        >
                          <span className="text-lg">✏️</span> Chỉnh sửa
                        </button>
                      )}
                      <button
                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors font-medium"
                        onClick={() => {
                          setConfirmType("privacy");
                          setIsMenuOpen(false);
                        }}
                      >
                        <span className="text-lg">{lesson.isPrivate ? "🔓" : "🔒"}</span>
                        {lesson.isPrivate ? "Chuyển công khai" : "Chuyển riêng tư"}
                      </button>
                      <div className="h-px bg-gray-100 my-1 mx-2"></div>
                      <button
                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-medium"
                        onClick={() => {
                          setConfirmType("delete");
                          setIsMenuOpen(false);
                        }}
                      >
                        <span className="text-lg">🗑️</span> Xoá bài học
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1">
            {lesson.description || "Không có mô tả cho bài học này. Hãy thêm mô tả để giúp người học hiểu rõ hơn về nội dung."}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-auto pt-5 border-t border-gray-100">
            <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-1.5 rounded-full text-xs font-bold text-blue-700 border border-blue-100/50">
              <span>📚</span> {lesson.wordCount} từ vựng
            </div>
            {lesson.isPrivate ? (
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-bold text-amber-700 border border-amber-100/50">
                <span>🔒</span> Riêng tư
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 border border-emerald-100/50">
                <span>🌍</span> Công khai
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white">
                {lesson.creator.charAt(0).toUpperCase()}
              </div>
              {lesson.creator}
            </div>
            <div className="text-[10px] text-gray-300 font-medium italic">
              {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmType === "delete"}
        title="Xác nhận xoá"
        message={`Bạn có chắc chắn muốn xoá bài học "${lesson.title}" không? Hành động này không thể hoàn tác.`}
        onConfirm={async () => {
          try {
            await onDelete(lesson.id);
            toast.success(`Đã xoá bài học "${lesson.title}"`);
          } catch {
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
          } catch {
            toast.error("Không thể cập nhật trạng thái bài học.");
          }
          setConfirmType(null);
        }}
        onCancel={() => setConfirmType(null)}
      />
    </>
  );
}