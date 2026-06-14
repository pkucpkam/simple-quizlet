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
}: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<null | "delete" | "privacy">(null);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const storedUser = sessionStorage.getItem("user");
  const currentUsername = storedUser ? JSON.parse(storedUser).username : null;
  const isCreator = currentUsername === lesson.creator;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <>
      <div className="group bg-claude-surface border border-claude-border rounded-claude-md p-5 hover:border-claude-accent hover:shadow-claude transition-all flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 cursor-pointer" onClick={() => navigate(`/study/${lesson.id}`, { state: { vocabId: lesson.vocabId } })}>
            <h2 className="text-sm font-semibold text-claude-text line-clamp-2 group-hover:text-claude-accent transition-colors leading-snug">
              {lesson.title}
            </h2>
            {lesson.description && (
              <p className="text-xs text-claude-text-2 mt-1 line-clamp-2">
                {lesson.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
            {onFolderAction && (
              <button
                onClick={() => onFolderAction(lesson.id)}
                title={folderActionLabel}
                className="p-1.5 text-claude-text-3 hover:text-claude-accent hover:bg-claude-accent-lighter rounded-claude transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </button>
            )}

            {isCreator && (
              <div className="relative" ref={menuRef}>
                <button
                  className="p-1.5 text-claude-text-3 hover:text-claude-text hover:bg-claude-sidebar-hover rounded-claude transition-colors"
                  onClick={() => setIsMenuOpen(prev => !prev)}
                  title="Tùy chọn"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-claude-surface border border-claude-border rounded-claude-md shadow-claude-md z-20 py-1 animate-fade-in">
                    {onEdit && (
                      <button
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-claude-text hover:bg-claude-surface-2 transition-colors"
                        onClick={() => { onEdit(lesson.id); setIsMenuOpen(false); }}
                      >
                        <svg className="h-4 w-4 text-claude-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Chỉnh sửa
                      </button>
                    )}
                    <button
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-claude-text hover:bg-claude-surface-2 transition-colors"
                      onClick={() => { setConfirmType("privacy"); setIsMenuOpen(false); }}
                    >
                      <svg className="h-4 w-4 text-claude-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {lesson.isPrivate
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        }
                      </svg>
                      {lesson.isPrivate ? "Chuyển công khai" : "Chuyển riêng tư"}
                    </button>
                    <div className="h-px bg-claude-border mx-2 my-1" />
                    <button
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-claude-error hover:bg-claude-error-light transition-colors"
                      onClick={() => { setConfirmType("delete"); setIsMenuOpen(false); }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Xoá bài học
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-claude-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 bg-claude-accent-light text-claude-accent rounded-full">
              {lesson.wordCount} từ
            </span>
            {lesson.isPrivate ? (
              <span className="text-xs font-medium px-2 py-0.5 bg-claude-surface-2 text-claude-text-3 border border-claude-border rounded-full">
                🔒 Riêng tư
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 bg-claude-success-light text-claude-success rounded-full">
                🌍 Công khai
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-claude-text-3">
            <div className="w-4 h-4 rounded-full bg-claude-accent flex items-center justify-center text-[9px] font-bold text-white">
              {lesson.creator.charAt(0).toUpperCase()}
            </div>
            <span className="truncate max-w-[80px]">{lesson.creator}</span>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmType === "delete"}
        title="Xác nhận xoá"
        message={`Bạn có chắc chắn muốn xoá bài học "${lesson.title}"? Hành động này không thể hoàn tác.`}
        onConfirm={async () => {
          try { await onDelete(lesson.id); toast.success(`Đã xoá bài học "${lesson.title}"`); }
          catch { toast.error("Không thể xoá bài học."); }
          setConfirmType(null);
        }}
        onCancel={() => setConfirmType(null)}
        confirmLabel="Xóa"
      />

      <ConfirmModal
        open={confirmType === "privacy"}
        title="Thay đổi quyền riêng tư"
        message={`Bạn có chắc chắn muốn ${lesson.isPrivate ? "chuyển công khai" : "chuyển riêng tư"} bài học "${lesson.title}"?`}
        onConfirm={async () => {
          try { await onTogglePrivacy(lesson.id, !lesson.isPrivate); toast.success(`Đã cập nhật quyền bài học "${lesson.title}"`); }
          catch { toast.error("Không thể cập nhật trạng thái bài học."); }
          setConfirmType(null);
        }}
        onCancel={() => setConfirmType(null)}
        confirmVariant="primary"
        confirmLabel="Xác nhận"
      />
    </>
  );
}