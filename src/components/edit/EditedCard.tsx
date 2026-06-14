import { useState, useEffect } from "react";
import type { VocabItem } from "../../service/lessonService";
import { ChevronDown } from "lucide-react";

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
    <div className="bg-claude-surface rounded-claude-lg shadow-claude border border-claude-border overflow-hidden flex flex-col h-full transition-all duration-200">
      <div className="p-4 grid grid-cols-1 gap-3 flex-1">
        <div>
          <label className="block text-[10px] font-bold text-claude-text-3 uppercase tracking-wider mb-1">Từ vựng *</label>
          <input
            type="text"
            value={localItem.word}
            onChange={(e) => updateField("word", e.target.value)}
            className="w-full border border-claude-border rounded-claude px-3 py-2 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent font-bold text-claude-text bg-claude-surface-2 transition-colors text-sm"
            placeholder="e.g. abandon"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-claude-text-3 uppercase tracking-wider mb-1">Nghĩa *</label>
          <input
            type="text"
            value={localItem.definition}
            onChange={(e) => updateField("definition", e.target.value)}
            className="w-full border border-claude-border rounded-claude px-3 py-2 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent text-claude-text bg-claude-surface-2 transition-colors text-sm"
            placeholder="e.g. bỏ rơi"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-[10px] font-bold text-claude-text-3 uppercase tracking-wider mb-1">IPA</label>
                <input
                    type="text"
                    value={localItem.ipa || ""}
                    onChange={(e) => updateField("ipa", e.target.value)}
                    className="w-full border border-claude-border rounded-claude px-3 py-2 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent font-mono text-claude-accent bg-claude-surface-2 text-sm transition-colors"
                    placeholder="/əˈbændən/"
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold text-claude-text-3 uppercase tracking-wider mb-1">Loại từ</label>
                <div className="relative">
                    <select
                        value={localItem.wordType || ""}
                        onChange={(e) => updateField("wordType", e.target.value)}
                        className="appearance-none w-full border border-claude-border rounded-claude pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent text-claude-text bg-claude-surface-2 text-sm cursor-pointer transition-colors"
                    >
                        <option value="">-- Chọn --</option>
                        {WORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-claude-text-3">
                        <ChevronDown className="w-4 h-4" strokeWidth={2} />
                    </div>
                </div>
            </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-claude-text-3 uppercase tracking-wider mb-1">Ví dụ EN</label>
          <input
            type="text"
            value={localItem.exampleEn || ""}
            onChange={(e) => updateField("exampleEn", e.target.value)}
            className="w-full border border-claude-border rounded-claude px-3 py-2 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent text-claude-text-2 bg-claude-surface-2 text-sm transition-colors"
            placeholder="e.g. He abandoned the car."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-claude-text-3 uppercase tracking-wider mb-1">Ví dụ VI</label>
          <input
            type="text"
            value={localItem.exampleVi || ""}
            onChange={(e) => updateField("exampleVi", e.target.value)}
            className="w-full border border-claude-border rounded-claude px-3 py-2 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent text-claude-text-2 bg-claude-surface-2 text-sm transition-colors"
            placeholder="e.g. Anh ấy bỏ lại xe."
          />
        </div>
      </div>
      <div className="bg-claude-surface-2 border-t border-claude-border px-4 py-2 flex justify-end">
        <button
          onClick={onDelete}
          className="text-claude-error hover:text-red-700 text-sm font-semibold transition-colors"
        >
          Xóa
        </button>
      </div>
    </div>
  );
}
