import React, { useState, useRef, useEffect } from 'react';
import type { Folder } from '../../types/folder';

interface FolderSelectProps {
  folders: Folder[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const FolderSelect: React.FC<FolderSelectProps> = ({
  folders,
  selectedId,
  onChange,
  disabled = false,
  placeholder = "Không chọn thư mục"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedFolder = folders.find(f => f.id === selectedId);

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id: string | null) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const getFolderColor = (folder: Folder) => {
    return folder.color || '#6b6964'; // Fallback to claude-text-2 color
  };

  return (
    <div className="relative w-full md:w-80" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={[
          "w-full flex items-center justify-between bg-claude-surface border rounded-claude px-4 py-2.5 text-sm transition-all text-left",
          "focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent",
          disabled ? "opacity-50 cursor-not-allowed bg-claude-surface-2" : "cursor-pointer hover:border-claude-border-strong",
          isOpen ? "border-transparent ring-2 ring-claude-accent shadow-claude-sm" : "border-claude-border shadow-sm"
        ].join(" ")}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedFolder ? (
            <>
              <span 
                className="flex items-center justify-center w-6 h-6 rounded-full text-base flex-shrink-0"
                style={{ 
                  backgroundColor: `${getFolderColor(selectedFolder)}15`,
                  color: getFolderColor(selectedFolder)
                }}
              >
                {selectedFolder.icon || "📁"}
              </span>
              <span className="font-semibold text-claude-text truncate">
                {selectedFolder.name}
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-claude-sidebar text-claude-text-3 text-sm flex-shrink-0">
                📁
              </span>
              <span className="text-claude-text-3 font-medium truncate">
                {placeholder}
              </span>
            </>
          )}
        </div>
        
        {/* Chevron Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={[
            "w-5 h-5 text-claude-text-3 transition-transform duration-200 flex-shrink-0",
            isOpen ? "transform rotate-180" : ""
          ].join(" ")}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 bg-claude-surface border border-claude-border rounded-claude shadow-claude-lg animate-fade-in overflow-hidden max-h-80 flex flex-col">
          {/* Search Input (Only show if there are multiple options to filter, or always show for 3+ folders) */}
          {folders.length >= 3 && (
            <div className="p-2 border-b border-claude-border bg-claude-surface-2 flex-shrink-0">
              <div className="relative flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-claude-text-3 absolute left-2.5 pointer-events-none"
                >
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm kiếm thư mục..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-claude-surface border border-claude-border rounded px-2.5 py-1.5 pl-8 text-xs text-claude-text focus:outline-none focus:ring-1 focus:ring-claude-accent focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto py-1 flex-1">
            {/* None Option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={[
                "w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left transition-colors",
                !selectedId 
                  ? "bg-claude-accent-lighter/80 text-claude-accent font-medium" 
                  : "text-claude-text hover:bg-claude-surface-2"
              ].join(" ")}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-claude-sidebar text-claude-text-3 text-xs flex-shrink-0">
                  📁
                </span>
                <span className="truncate">{placeholder}</span>
              </div>
              {!selectedId && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 text-claude-accent">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Folder Options */}
            {filteredFolders.length > 0 ? (
              filteredFolders.map((folder) => {
                const isSelected = selectedId === folder.id;
                const folderColor = getFolderColor(folder);
                
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleSelect(folder.id)}
                    className={[
                      "w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left transition-colors border-l-4",
                      isSelected 
                        ? "bg-claude-accent-lighter/80 text-claude-accent font-semibold" 
                        : "text-claude-text hover:bg-claude-surface-2"
                    ].join(" ")}
                    style={{
                      borderLeftColor: folderColor || 'transparent'
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span 
                        className="flex items-center justify-center w-6 h-6 rounded-full text-base flex-shrink-0"
                        style={{ 
                          backgroundColor: `${folderColor}15`,
                          color: folderColor
                        }}
                      >
                        {folder.icon || "📁"}
                      </span>
                      <span className="truncate">{folder.name}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {folder.lessonCount !== undefined && folder.lessonCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-claude-sidebar text-claude-text-2 font-medium">
                          {folder.lessonCount} {folder.lessonCount === 1 ? 'bài học' : 'bài học'}
                        </span>
                      )}
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-claude-accent">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            ) : searchTerm ? (
              <div className="px-4 py-4 text-xs text-claude-text-3 text-center">
                Không tìm thấy thư mục nào phù hợp
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderSelect;
