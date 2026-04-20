import { useState, useEffect } from "react";
import type { VocabItem } from "../../service/lessonService";

interface EditableCardProps {
  item: VocabItem;
  onChange: (newItem: VocabItem) => void;
  onDelete: () => void;
}

const WORD_TYPES = ["noun", "verb", "adjective", "adverb", "phrase", "idiom", "other"];

export default function EditableCard({ item, onChange, onDelete }: EditableCardProps) {
  const [localItem, setLocalItem] = useState<VocabItem>(item);

  // Sync if props change externally
  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  const updateField = (field: keyof VocabItem, value: string) => {
    const next = { ...localItem, [field]: value };
    setLocalItem(next);
    onChange(next);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="p-4 grid grid-cols-1 gap-3 flex-1">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Từ vựng *</label>
          <input
            type="text"
            value={localItem.word}
            onChange={(e) => updateField("word", e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-bold text-gray-800 transition-colors"
            placeholder="e.g. abandon"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nghĩa *</label>
          <input
            type="text"
            value={localItem.definition}
            onChange={(e) => updateField("definition", e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-800 transition-colors"
            placeholder="e.g. bỏ rơi"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">IPA</label>
                <input
                    type="text"
                    value={localItem.ipa || ""}
                    onChange={(e) => updateField("ipa", e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-mono text-blue-600 text-sm transition-colors"
                    placeholder="/əˈbændən/"
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Loại từ</label>
                <select
                    value={localItem.wordType || ""}
                    onChange={(e) => updateField("wordType", e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-700 bg-white text-sm transition-colors"
                >
                    <option value="">-- Chọn --</option>
                    {WORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ví dụ EN</label>
          <input
            type="text"
            value={localItem.exampleEn || ""}
            onChange={(e) => updateField("exampleEn", e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-700 text-sm transition-colors"
            placeholder="e.g. He abandoned the car."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ví dụ VI</label>
          <input
            type="text"
            value={localItem.exampleVi || ""}
            onChange={(e) => updateField("exampleVi", e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-700 text-sm transition-colors"
            placeholder="e.g. Anh ấy bỏ lại xe."
          />
        </div>
      </div>
      <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 flex justify-end">
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 text-sm font-bold transition-colors"
        >
          Xóa
        </button>
      </div>
    </div>
  );
}
