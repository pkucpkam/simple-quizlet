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
            className="relative bg-white shadow-md rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-l-4"
            style={{ borderLeftColor: folder.color }}
            onClick={() => onClick(folder.id)}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <span className="text-4xl">{folder.icon}</span>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{folder.name}</h3>
                        {folder.description && (
                            <p className="text-sm text-gray-600 mt-1">{folder.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                            {folder.lessonCount || 0} bài học
                        </p>
                    </div>
                </div>

                {(onEdit || onDelete) && (
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            ⋮
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-10 border">
                                {onEdit && (
                                    <button
                                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                                        onClick={() => {
                                            onEdit(folder.id);
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        ✏️ Chỉnh sửa
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 rounded-b-lg"
                                        onClick={() => {
                                            onDelete(folder.id);
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        🗑️ Xóa
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
