import { useState } from "react";
import type { CreateFolderData } from "../../types/folder";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateFolderData) => Promise<void>;
    initialData?: CreateFolderData & { id?: string };
    isEdit?: boolean;
}

const PRESET_COLORS = [
    { name: "Xanh dương", value: "#3B82F6" },
    { name: "Xanh lá", value: "#10B981" },
    { name: "Đỏ", value: "#EF4444" },
    { name: "Vàng", value: "#F59E0B" },
    { name: "Tím", value: "#8B5CF6" },
    { name: "Hồng", value: "#EC4899" },
    { name: "Cam", value: "#F97316" },
    { name: "Xanh ngọc", value: "#14B8A6" },
];

const PRESET_ICONS = ["📁", "📚", "🎓", "💼", "🎯", "🌟", "🔥", "💡", "🚀", "📖", "✨", "🎨"];

export default function CreateFolderModal({ isOpen, onClose, onSubmit, initialData, isEdit }: Props) {
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [color, setColor] = useState(initialData?.color || "#3B82F6");
    const [icon, setIcon] = useState(initialData?.icon || "📁");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            alert("Vui lòng nhập tên thư mục");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ name: name.trim(), description: description.trim(), color, icon });
            // Reset form
            setName("");
            setDescription("");
            setColor("#3B82F6");
            setIcon("📁");
            onClose();
        } catch (error) {
            console.error("Error submitting folder:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={isEdit ? "Chỉnh sửa thư mục" : "Tạo thư mục mới"}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Tên thư mục */}
                <Input
                    label="Tên thư mục *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Tiếng Anh giao tiếp"
                    maxLength={50}
                    required
                />

                {/* Mô tả */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-claude-text">
                        Mô tả
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-claude-surface border border-claude-border rounded-claude text-sm text-claude-text placeholder:text-claude-text-3 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent transition-colors duration-150 resize-none"
                        placeholder="Mô tả ngắn về thư mục này..."
                        rows={3}
                        maxLength={200}
                    />
                </div>

                {/* Chọn icon */}
                <div>
                    <label className="block text-sm font-medium text-claude-text mb-2">
                        Chọn biểu tượng
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                        {PRESET_ICONS.map((presetIcon) => (
                            <button
                                key={presetIcon}
                                type="button"
                                onClick={() => setIcon(presetIcon)}
                                className={`text-2xl p-3 rounded-claude border-2 transition-all ${icon === presetIcon
                                        ? "border-claude-accent bg-claude-accent-lighter scale-110"
                                        : "border-claude-border hover:border-claude-border-strong hover:bg-claude-surface-2"
                                    }`}
                            >
                                {presetIcon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chọn màu */}
                <div>
                    <label className="block text-sm font-medium text-claude-text mb-2">
                        Chọn màu sắc
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {PRESET_COLORS.map((presetColor) => (
                            <button
                                key={presetColor.value}
                                type="button"
                                onClick={() => setColor(presetColor.value)}
                                className={`p-3 rounded-claude border-2 transition-all ${color === presetColor.value
                                        ? "border-claude-text-2 scale-105"
                                        : "border-claude-border hover:border-claude-border-strong"
                                    }`}
                                style={{ backgroundColor: presetColor.value }}
                                title={presetColor.name}
                            >
                                {color === presetColor.value && (
                                    <span className="text-white text-lg">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-claude-surface-2 p-4 rounded-claude border-2 border-dashed border-claude-border">
                    <p className="text-xs text-claude-text-2 mb-2">Xem trước:</p>
                    <div
                        className="bg-claude-surface p-4 rounded-claude border-l-4 shadow-claude-sm"
                        style={{ borderLeftColor: color }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{icon}</span>
                            <div>
                                <h3 className="font-semibold text-claude-text">
                                    {name || "Tên thư mục"}
                                </h3>
                                <p className="text-sm text-claude-text-2">
                                    {description || "Mô tả thư mục"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isSubmitting}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        loading={isSubmitting}
                    >
                        {isEdit ? "Cập nhật" : "Tạo thư mục"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
