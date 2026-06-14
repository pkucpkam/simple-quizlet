import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import type { VocabItem } from "../../service/lessonService";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

interface ImportVocabModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (items: VocabItem[]) => void;
  initialText?: string;
}

type ImportTab = "text" | "csv" | "excel";

const COLUMNS_HINT = "word ; definition ; ipa ; loại từ ; ví dụ EN ; ví dụ VI";

/**
 * Parse a single row of cells (string[]) into a VocabItem.
 * Columns: 0=word, 1=definition, 2=ipa, 3=wordType, 4=exampleEn, 5=exampleVi
 */
function rowToVocabItem(cells: string[]): VocabItem | null {
  const word = cells[0]?.trim();
  const definition = cells[1]?.trim();
  if (!word || !definition) return null;
  return {
    word,
    definition,
    ipa: cells[2]?.trim() || undefined,
    wordType: cells[3]?.trim() || undefined,
    exampleEn: cells[4]?.trim() || undefined,
    exampleVi: cells[5]?.trim() || undefined,
  };
}

/** Parse semicolon-delimited text */
function parseTextInput(raw: string): VocabItem[] {
  return raw
    .split("\n")
    .map((line) => line.split(";").map((c) => c.trim()))
    .map(rowToVocabItem)
    .filter(Boolean) as VocabItem[];
}

/** Parse CSV text (comma or tab) */
function parseCsvText(raw: string): VocabItem[] {
  const lines = raw.trim().split("\n");
  // Detect delimiter: comma or tab
  const delimiter = lines[0]?.includes("\t") ? "\t" : ",";
  return lines
    .map((line) => line.split(delimiter).map((c) => c.replace(/^"|"$/g, "").trim()))
    .map(rowToVocabItem)
    .filter(Boolean) as VocabItem[];
}

export default function ImportVocabModal({ open, onClose, onImport, initialText = "" }: ImportVocabModalProps) {
  const [tab, setTab] = useState<ImportTab>("text");
  const [textInput, setTextInput] = useState("");
  const [preview, setPreview] = useState<VocabItem[]>([]);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTextInput(initialText);
      const items = parseTextInput(initialText);
      setPreview(items);
    }
  }, [open, initialText]);

  const updatePreview = (items: VocabItem[]) => {
    setPreview(items);
    setError(items.length === 0 ? "Không tìm thấy dữ liệu hợp lệ. Kiểm tra lại định dạng." : "");
  };

  const handleTextChange = (val: string) => {
    setTextInput(val);
    const items = parseTextInput(val);
    updatePreview(items);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");

    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
          // Skip header row if first cell looks like "word" or "từ"
          const firstCell = String(rows[0]?.[0] ?? "").toLowerCase();
          const startRow = firstCell === "word" || firstCell === "từ" || firstCell === "từ vựng" ? 1 : 0;
          const items = rows.slice(startRow).map((r) => r.map(String)).map(rowToVocabItem).filter(Boolean) as VocabItem[];
          updatePreview(items);
        } catch {
          setError("Không thể đọc file Excel. Vui lòng kiểm tra lại.");
          setPreview([]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV / TXT
      reader.onload = (ev) => {
        const raw = ev.target?.result as string;
        const items = tab === "text" ? parseTextInput(raw) : parseCsvText(raw);
        updatePreview(items);
      };
      reader.readAsText(file, "UTF-8");
    }

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleConfirm = () => {
    if (preview.length === 0) return;
    onImport(preview);
    setTextInput("");
    setPreview([]);
    setFileName("");
    setError("");
    onClose();
  };

  const tabs: { id: ImportTab; label: string; icon: string }[] = [
    { id: "text", label: "Văn bản (;)", icon: "📝" },
    { id: "csv", label: "CSV / TXT", icon: "📄" },
    { id: "excel", label: "Excel", icon: "📊" },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="⚡ Import từ vựng nhanh"
      size="xl"
    >
      <div className="flex flex-col h-full max-h-[75vh]">
        {/* Header Tabs */}
        <div className="flex gap-2 pb-4 border-b border-claude-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setPreview([]); setError(""); setFileName(""); setTextInput(""); }}
              className={`px-4 py-2 rounded-claude text-sm font-bold transition-all ${
                tab === t.id
                  ? "bg-claude-accent-light text-claude-accent shadow-claude-sm"
                  : "text-claude-text-2 hover:bg-claude-sidebar-hover hover:text-claude-text"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable content body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Format hint */}
          <div className="bg-claude-accent-lighter border border-claude-accent-light rounded-claude-md p-4">
            <p className="text-xs font-bold text-claude-accent uppercase tracking-wider mb-1">Định dạng cột (từ trái sang phải)</p>
            <code className="text-sm text-claude-accent font-mono">{COLUMNS_HINT}</code>
            <p className="text-xs text-claude-text-2 mt-1">Chỉ bắt buộc 2 cột đầu (từ vựng &amp; nghĩa). Các cột còn lại là tùy chọn.</p>
          </div>

          {/* TEXT TAB */}
          {tab === "text" && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-claude-text">
                Dán văn bản (mỗi dòng một từ, các cột cách nhau bằng dấu <code className="bg-claude-surface-2 px-1.5 py-0.5 rounded border border-claude-border font-mono font-normal">;</code>)
              </label>
              <textarea
                rows={6}
                className="w-full bg-claude-surface border border-claude-border rounded-claude px-4 py-3 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent font-mono text-sm transition-colors text-claude-text"
                placeholder={`abandon ; bỏ rơi ; /əˈbændən/ ; verb ; He abandoned the car. ; Anh ta bỏ lại chiếc xe.\nbeneficial ; có lợi ; /ˌbenɪˈfɪʃl/ ; adjective`}
                value={textInput}
                onChange={(e) => handleTextChange(e.target.value)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-claude-accent hover:underline font-medium flex items-center gap-1"
              >
                📎 Hoặc tải file .txt lên
              </button>
              <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
            </div>
          )}

          {/* CSV TAB */}
          {tab === "csv" && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-claude-border rounded-claude-lg p-10 text-center cursor-pointer hover:border-claude-accent hover:bg-claude-accent-lighter transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-5xl mb-3">📄</div>
                {fileName ? (
                  <p className="font-bold text-claude-success">✓ {fileName}</p>
                ) : (
                  <>
                    <p className="font-bold text-claude-text">Nhấn để chọn file CSV hoặc TXT</p>
                    <p className="text-sm text-claude-text-3 mt-1">Hỗ trợ dấu phân cách: dấu phẩy (,) hoặc tab</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />

              <div className="bg-claude-surface-2 rounded-claude p-4 border border-claude-border">
                <p className="text-xs font-bold text-claude-text-2 mb-2 uppercase">Ví dụ nội dung CSV:</p>
                <pre className="text-xs font-mono text-claude-text-2 overflow-x-auto">{`word,definition,ipa,wordType,exampleEn,exampleVi\nabandon,bỏ rơi,/əˈbændən/,verb,He abandoned the car.,Anh ta bỏ lại chiếc xe.`}</pre>
              </div>
            </div>
          )}

          {/* EXCEL TAB */}
          {tab === "excel" && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-claude-border rounded-claude-lg p-10 text-center cursor-pointer hover:border-claude-accent hover:bg-claude-accent-lighter transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-5xl mb-3">📊</div>
                {fileName ? (
                  <p className="font-bold text-claude-success">✓ {fileName}</p>
                ) : (
                  <>
                    <p className="font-bold text-claude-text">Nhấn để chọn file Excel</p>
                    <p className="text-sm text-claude-text-3 mt-1">Hỗ trợ .xlsx và .xls — Sheet đầu tiên sẽ được đọc</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />

              <div className="bg-claude-surface-2 rounded-claude p-4 border border-claude-border">
                <p className="text-xs font-bold text-claude-text-2 mb-2 uppercase">Cấu trúc file Excel:</p>
                <div className="overflow-x-auto mt-2">
                  <table className="text-xs font-mono w-full border-collapse">
                    <thead>
                      <tr className="bg-claude-accent-lighter border-b border-claude-border">
                        {["A: word", "B: definition", "C: ipa", "D: wordType", "E: exampleEn", "F: exampleVi"].map(h => (
                          <th key={h} className="border border-claude-border px-2 py-1 text-left text-claude-accent font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {["abandon", "bỏ rơi", "/əˈbændən/", "verb", "He abandoned...", "Anh ta bỏ..."].map((v, i) => (
                          <td key={i} className="border border-claude-border px-2 py-1 text-claude-text-2">{v}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-claude-text-3 mt-2">* Hàng đầu có thể là tiêu đề hoặc dữ liệu — hệ thống tự nhận biết.</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-claude-error-light border border-claude-error/20 text-claude-error rounded-claude px-4 py-3 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-claude-text">Xem trước</h3>
                <span className="text-xs bg-claude-accent-light text-claude-accent font-bold px-2.5 py-1 rounded-full">
                  {preview.length} từ hợp lệ
                </span>
              </div>
              <div className="rounded-claude-md border border-claude-border overflow-hidden shadow-claude-sm max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-claude-surface-2 sticky top-0 border-b border-claude-border">
                    <tr>
                      {["Từ vựng", "Nghĩa", "IPA", "Loại từ", "Ví dụ EN"].map(h => (
                        <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-claude-text-2 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-claude-border bg-claude-surface">
                    {preview.map((item, i) => (
                      <tr key={i} className="hover:bg-claude-surface-2 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-claude-text">{item.word}</td>
                        <td className="px-4 py-2.5 text-claude-text-2">{item.definition}</td>
                        <td className="px-4 py-2.5 font-mono text-claude-accent text-xs">{item.ipa || "—"}</td>
                        <td className="px-4 py-2.5">
                          {item.wordType
                            ? <span className="bg-claude-accent-light text-claude-accent text-xs font-semibold px-2 py-0.5 rounded-full">{item.wordType}</span>
                            : <span className="text-claude-text-3">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-claude-text-2 italic text-xs truncate max-w-[200px]">{item.exampleEn || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-claude-border pt-4 flex items-center justify-between mt-auto">
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={preview.length === 0}
          >
            Thêm {preview.length > 0 ? `${preview.length} từ` : ""} vào bài học
          </Button>
        </div>
      </div>
    </Modal>
  );
}
