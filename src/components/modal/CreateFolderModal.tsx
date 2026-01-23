import { useState } from "react";
import type { CreateFolderData } from "../../types/folder";

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

    if (!isOpen) return null;

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        {isEdit ? "Chỉnh sửa thư mục" : "Tạo thư mục mới"}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Tên thư mục */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên thư mục <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="VD: Tiếng Anh giao tiếp"
                                maxLength={50}
                                required
                            />
                        </div>

                        {/* Mô tả */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Mô tả ngắn về thư mục này..."
                                rows={3}
                                maxLength={200}
                            />
                        </div>

                        {/* Chọn icon */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn biểu tượng
                            </label>
                            <div className="grid grid-cols-6 gap-2">
                                {PRESET_ICONS.map((presetIcon) => (
                                    <button
                                        key={presetIcon}
                                        type="button"
                                        onClick={() => setIcon(presetIcon)}
                                        className={`text-2xl p-3 rounded-lg border-2 transition-all ${icon === presetIcon
                                                ? "border-blue-500 bg-blue-50 scale-110"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        {presetIcon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chọn màu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn màu sắc
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {PRESET_COLORS.map((presetColor) => (
                                    <button
                                        key={presetColor.value}
                                        type="button"
                                        onClick={() => setColor(presetColor.value)}
                                        className={`p-3 rounded-lg border-2 transition-all ${color === presetColor.value
                                                ? "border-gray-800 scale-105"
                                                : "border-gray-200 hover:border-gray-300"
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
                        <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                            <p className="text-xs text-gray-500 mb-2">Xem trước:</p>
                            <div
                                className="bg-white p-4 rounded-lg border-l-4 shadow-sm"
                                style={{ borderLeftColor: color }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{icon}</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            {name || "Tên thư mục"}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {description || "Mô tả thư mục"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                disabled={isSubmitting}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Tạo thư mục"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
