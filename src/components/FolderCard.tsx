import { useState } from "react";
import type { Folder } from "../types/folder";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import FolderIcon from "./ui/FolderIcon";

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
          <div
            className="w-12 h-12 rounded-claude-md flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
            style={{ backgroundColor: (folder.color || '#3B82F6') + '22' }}
          >
            <FolderIcon name={folder.icon} className="h-6 w-6" style={{ color: folder.color || '#3B82F6' }} />
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
              <MoreVertical className="h-4 w-4" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-claude-surface border border-claude-border rounded-claude-md shadow-claude-md z-20 py-1 animate-fade-in">
                {onEdit && (
                  <button
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-claude-text hover:bg-claude-surface-2 transition-colors"
                    onClick={() => { onEdit(folder.id); setIsMenuOpen(false); }}
                  >
                    <Pencil className="h-3.5 w-3.5 text-claude-text-3" strokeWidth={2} />
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
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
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
