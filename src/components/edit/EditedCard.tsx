import { useState } from "react";

interface EditableCardProps {
  word: string;
  definition: string;
  onChange: (newWord: string, newDefinition: string) => void;
  onDelete: () => void;
}

export default function EditableCard({ word, definition, onChange, onDelete }: EditableCardProps) {
  const [localWord, setLocalWord] = useState(word);
  const [localDefinition, setLocalDefinition] = useState(definition);

  const handleBlur = () => {
    onChange(localWord, localDefinition);
  };

  return (
    <div className="border rounded-lg shadow-md p-4 flex flex-col gap-3 bg-white">
      <input
        type="text"
        value={localWord}
        onChange={(e) => setLocalWord(e.target.value)}
        onBlur={handleBlur}
        className="border-b border-gray-300 focus:outline-none font-bold text-lg"
        placeholder="Nhập từ..."
      />
      <textarea
        value={localDefinition}
        onChange={(e) => setLocalDefinition(e.target.value)}
        onBlur={handleBlur}
        className="border border-gray-300 rounded p-2 resize-none text-gray-700"
        placeholder="Nhập nghĩa..."
        rows={3}
      />
      <button
        className="text-red-600 text-sm hover:underline self-end"
        onClick={onDelete}
      >
        Xóa
      </button>
    </div>
  );
}
