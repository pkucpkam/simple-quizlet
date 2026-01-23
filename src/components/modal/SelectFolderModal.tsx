import { useState, useEffect } from "react";
import type { Folder } from "../../types/folder";
import { folderService } from "../../service/folderService";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (folderId: string | null) => void;
    currentFolderId?: string | null;
    username: string;
}

export default function SelectFolderModal({ isOpen, onClose, onSelect, currentFolderId, username }: Props) {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId || null);

    useEffect(() => {
        if (isOpen) {
            loadFolders();
        }
    }, [isOpen, username]);

    const loadFolders = async () => {
        try {
            setLoading(true);
            const fetchedFolders = await folderService.getMyFolders(username);
            setFolders(fetchedFolders);
        } catch (error) {
            console.error("Error loading folders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        onSelect(selectedFolderId);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Chọn thư mục</h2>
                    <p className="text-sm text-gray-600 mt-1">Chọn thư mục để lưu bài học này</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <p className="text-center text-gray-500">Đang tải...</p>
                    ) : folders.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-2">Bạn chưa có thư mục nào</p>
                            <p className="text-sm text-gray-400">Hãy tạo thư mục mới để tổ chức bài học</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Option: No folder */}
                            <div
                                onClick={() => setSelectedFolderId(null)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedFolderId === null
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📂</span>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">Không có thư mục</h3>
                                        <p className="text-sm text-gray-600">Bài học sẽ không thuộc thư mục nào</p>
                                    </div>
                                    {selectedFolderId === null && (
                                        <span className="text-blue-500 text-xl">✓</span>
                                    )}
                                </div>
                            </div>

                            {/* Folder options */}
                            {folders.map((folder) => (
                                <div
                                    key={folder.id}
                                    onClick={() => setSelectedFolderId(folder.id)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedFolderId === folder.id
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    style={{
                                        borderLeftWidth: "4px",
                                        borderLeftColor: selectedFolderId === folder.id ? folder.color : "transparent",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{folder.icon}</span>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800">{folder.name}</h3>
                                            {folder.description && (
                                                <p className="text-sm text-gray-600">{folder.description}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                {folder.lessonCount || 0} bài học
                                            </p>
                                        </div>
                                        {selectedFolderId === folder.id && (
                                            <span className="text-blue-500 text-xl">✓</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-gray-50">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Xác nhận
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
