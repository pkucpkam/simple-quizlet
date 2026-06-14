import { useState, useEffect, useRef } from "react";
import type { VocabItem } from "../../service/lessonService";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { ChevronDown, AlertCircle } from "lucide-react";

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
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm từ vựng mới"
      size="md"
    >
      <div className="space-y-4">
        {validationError && (
          <div className="bg-claude-error-light border border-claude-error/20 text-claude-error rounded-claude px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Word & Definition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            ref={firstInputRef}
            label="Từ vựng *"
            placeholder="e.g. abandon"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="font-semibold"
          />

          <Input
            label="Nghĩa tiếng Việt *"
            placeholder="e.g. từ bỏ, bỏ rơi"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
          />
        </div>

        {/* IPA & Word Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phiên âm (IPA)"
            placeholder="e.g. /əˈbændən/"
            value={ipa}
            onChange={(e) => setIpa(e.target.value)}
            className="font-mono text-claude-accent"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-claude-text">
              Loại từ
            </label>
            <div className="relative">
              <select
                className="appearance-none w-full bg-claude-surface border border-claude-border rounded-claude pl-3 pr-10 py-2.5 text-sm text-claude-text focus:outline-none focus:ring-2 focus:ring-claude-accent cursor-pointer transition-colors duration-150"
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-claude-text-3">
                <ChevronDown className="w-4 h-4" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Example EN */}
        <Input
          label="Ví dụ tiếng Anh"
          placeholder="e.g. He abandoned his car on the highway."
          value={exampleEn}
          onChange={(e) => setExampleEn(e.target.value)}
        />

        {/* Example VI */}
        <Input
          label="Ví dụ tiếng Việt"
          placeholder="e.g. Anh ấy đã bỏ lại xe của mình trên đường cao tốc."
          value={exampleVi}
          onChange={(e) => setExampleVi(e.target.value)}
        />

        {/* Footer buttons */}
        <div className="border-t border-claude-border pt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Huỷ
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => handleAdd(true)}
              className="w-full sm:w-auto border-claude-accent text-claude-accent hover:bg-claude-accent-lighter flex items-center justify-center gap-2"
            >
              <span>Thêm &amp; Tiếp tục</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => handleAdd(false)}
              className="w-full sm:w-auto"
            >
              Thêm
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
