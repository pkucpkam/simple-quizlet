import { useState, useEffect } from "react";
import type { Folder } from "../../types/folder";
import { folderService } from "../../service/folderService";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

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

        if (isOpen) {
            loadFolders();
        }
    }, [isOpen, username]);

    const handleSubmit = () => {
        onSelect(selectedFolderId);
        onClose();
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title="Chọn thư mục"
            size="md"
        >
            <div className="flex flex-col h-full max-h-[60vh]">
                <p className="text-sm text-claude-text-2 mb-4">Chọn thư mục để lưu bài học này</p>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[150px]">
                    {loading ? (
                        <div className="space-y-3">
                            <div className="h-16 skeleton w-full rounded-claude" />
                            <div className="h-16 skeleton w-full rounded-claude" />
                            <div className="h-16 skeleton w-full rounded-claude" />
                        </div>
                    ) : folders.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-claude-text-2 mb-1">Bạn chưa có thư mục nào</p>
                            <p className="text-sm text-claude-text-3">Hãy tạo thư mục mới để tổ chức bài học</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Option: No folder */}
                            <div
                                onClick={() => setSelectedFolderId(null)}
                                className={`p-4 rounded-claude border-2 cursor-pointer transition-all ${selectedFolderId === null
                                    ? "border-claude-accent bg-claude-accent-lighter"
                                    : "border-claude-border hover:border-claude-border-strong hover:bg-claude-surface-2"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📂</span>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-claude-text">Không có thư mục</h3>
                                        <p className="text-sm text-claude-text-2">Bài học sẽ không thuộc thư mục nào</p>
                                    </div>
                                    {selectedFolderId === null && (
                                        <span className="text-claude-accent text-xl">✓</span>
                                    )}
                                </div>
                            </div>

                            {/* Folder options */}
                            {folders.map((folder) => (
                                <div
                                    key={folder.id}
                                    onClick={() => setSelectedFolderId(folder.id)}
                                    className={`p-4 rounded-claude border-2 cursor-pointer transition-all ${selectedFolderId === folder.id
                                        ? "border-claude-accent bg-claude-accent-lighter"
                                        : "border-claude-border hover:border-claude-border-strong hover:bg-claude-surface-2"
                                        }`}
                                    style={{
                                        borderLeftWidth: "4px",
                                        borderLeftColor: selectedFolderId === folder.id ? folder.color : "transparent",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{folder.icon}</span>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-claude-text">{folder.name}</h3>
                                            {folder.description && (
                                                <p className="text-sm text-claude-text-2 truncate max-w-[250px]">{folder.description}</p>
                                            )}
                                            <p className="text-xs text-claude-text-3 mt-1">
                                                {folder.lessonCount || 0} bài học
                                            </p>
                                        </div>
                                        {selectedFolderId === folder.id && (
                                            <span className="text-claude-accent text-xl">✓</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-6 mt-4 border-t border-claude-border">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        className="flex-1"
                    >
                        Xác nhận
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
