import { useState } from "react";
import type { Folder } from "../types/folder";

interface Props {
  folder: Folder;
  onClick: (folderId: string) => void;
  onEdit?: (folderId: string) => void;
  onDelete?: (folderId: string) => void;
}

export default function FolderCard({ folder, onClick, onEdit, onDelete }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className="group relative bg-claude-surface border border-claude-border rounded-claude-md p-5 cursor-pointer hover:border-claude-accent hover:shadow-claude transition-all"
      onClick={() => onClick(folder.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-claude-md bg-claude-surface-2 border border-claude-border flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
            {folder.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-claude-text truncate group-hover:text-claude-accent transition-colors">{folder.name}</h3>
            {folder.description && (
              <p className="text-xs text-claude-text-2 mt-0.5 truncate">{folder.description}</p>
            )}
            <p className="text-xs text-claude-text-3 mt-1">
              {folder.lessonCount || 0} bài học
            </p>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              className="p-1.5 text-claude-text-3 hover:text-claude-text hover:bg-claude-sidebar-hover rounded-claude transition-colors opacity-0 group-hover:opacity-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-claude-surface border border-claude-border rounded-claude-md shadow-claude-md z-20 py-1 animate-fade-in">
                {onEdit && (
                  <button
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-claude-text hover:bg-claude-surface-2 transition-colors"
                    onClick={() => { onEdit(folder.id); setIsMenuOpen(false); }}
                  >
                    <svg className="h-3.5 w-3.5 text-claude-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Chỉnh sửa
                  </button>
                )}
                {onDelete && (
                  <>
                    <div className="h-px bg-claude-border mx-2 my-1" />
                    <button
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-claude-error hover:bg-claude-error-light transition-colors"
                      onClick={() => { onDelete(folder.id); setIsMenuOpen(false); }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Xóa thư mục
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
