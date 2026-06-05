import { useState, useEffect, useRef } from "react";
import type { VocabItem } from "../../service/lessonService";

interface AddVocabModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: VocabItem) => void;
  WORD_TYPES: string[];
}

export default function AddVocabModal({ open, onClose, onAdd, WORD_TYPES }: AddVocabModalProps) {
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [ipa, setIpa] = useState("");
  const [wordType, setWordType] = useState("");
  const [exampleEn, setExampleEn] = useState("");
  const [exampleVi, setExampleVi] = useState("");
  const [validationError, setValidationError] = useState("");

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus the first input when the modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);
      setWord("");
      setDefinition("");
      setIpa("");
      setWordType("");
      setExampleEn("");
      setExampleVi("");
      setValidationError("");
    }
  }, [open]);

  if (!open) return null;

  const handleAdd = (keepOpen: boolean) => {
    setValidationError("");
    const trimmedWord = word.trim();
    const trimmedDef = definition.trim();

    if (!trimmedWord) {
      setValidationError("Vui lòng nhập từ vựng.");
      return;
    }
    if (!trimmedDef) {
      setValidationError("Vui lòng nhập định nghĩa tiếng Việt.");
      return;
    }

    const newItem: VocabItem = {
      word: trimmedWord,
      definition: trimmedDef,
      ipa: ipa.trim() || undefined,
      wordType: wordType || undefined,
      exampleEn: exampleEn.trim() || undefined,
      exampleVi: exampleVi.trim() || undefined,
    };

    onAdd(newItem);

    if (keepOpen) {
      // Clear fields and focus word input again
      setWord("");
      setDefinition("");
      setIpa("");
      setWordType("");
      setExampleEn("");
      setExampleVi("");
      firstInputRef.current?.focus();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                ➕ Thêm từ vựng mới
              </h2>
              <p className="text-blue-100 text-xs mt-1">
                Nhập chi tiết từ vựng để thêm vào bài học của bạn
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm font-medium">
              ⚠️ {validationError}
            </div>
          )}

          {/* Word & Definition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                Từ vựng <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors font-semibold text-gray-800 text-sm"
                placeholder="e.g. abandon"
                value={word}
                onChange={(e) => setWord(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                Nghĩa tiếng Việt <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-gray-800 text-sm"
                placeholder="e.g. từ bỏ, bỏ rơi"
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
              />
            </div>
          </div>

          {/* IPA & Word Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                Phiên âm (IPA)
              </label>
              <input
                type="text"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors font-mono text-blue-600 text-sm"
                placeholder="e.g. /əˈbændən/"
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                Loại từ
              </label>
              <select
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-gray-700 bg-white text-sm"
                value={wordType}
                onChange={(e) => setWordType(e.target.value)}
              >
                <option value="">-- Chọn loại từ --</option>
                {WORD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Example EN */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Ví dụ tiếng Anh
            </label>
            <input
              type="text"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-gray-700 text-sm"
              placeholder="e.g. He abandoned his car on the highway."
              value={exampleEn}
              onChange={(e) => setExampleEn(e.target.value)}
            />
          </div>

          {/* Example VI */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Ví dụ tiếng Việt
            </label>
            <input
              type="text"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-gray-700 text-sm"
              placeholder="e.g. Anh ấy đã bỏ lại xe của mình trên đường cao tốc."
              value={exampleVi}
              onChange={(e) => setExampleVi(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition-colors text-sm"
          >
            Huỷ
          </button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleAdd(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-blue-200 text-blue-600 font-bold hover:bg-blue-50 transition-colors text-sm"
            >
              🔄 Thêm &amp; Tiếp tục
            </button>
            <button
              onClick={() => handleAdd(false)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 transition-colors text-sm"
            >
              ✅ Thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
