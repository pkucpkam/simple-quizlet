import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import type { VocabItem } from "../../service/lessonService";

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

  if (!open) return null;

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">⚡ Import từ vựng nhanh</h2>
              <p className="text-blue-100 text-sm mt-1">Nhập hàng loạt từ vựng từ file hoặc văn bản</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors text-2xl">✕</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setPreview([]); setError(""); setFileName(""); setTextInput(""); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  tab === t.id ? "bg-white text-blue-700 shadow-md" : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Format hint */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Định dạng cột (từ trái sang phải)</p>
            <code className="text-sm text-blue-800 font-mono">{COLUMNS_HINT}</code>
            <p className="text-xs text-blue-500 mt-1">Chỉ bắt buộc 2 cột đầu (từ vựng &amp; nghĩa). Các cột còn lại là tùy chọn.</p>
          </div>

          {/* TEXT TAB */}
          {tab === "text" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Dán văn bản (mỗi dòng một từ, các cột cách nhau bằng dấu <code className="bg-gray-100 px-1 rounded">;</code>)
              </label>
              <textarea
                rows={8}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 font-mono text-sm transition-colors"
                placeholder={`abandon ; bỏ rơi ; /əˈbændən/ ; verb ; He abandoned the car. ; Anh ta bỏ lại chiếc xe.\nbeneficial ; có lợi ; /ˌbenɪˈfɪʃl/ ; adjective`}
                value={textInput}
                onChange={(e) => handleTextChange(e.target.value)}
              />
              {/* File upload for txt */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-sm text-blue-600 hover:underline font-medium"
              >
                📎 Hoặc tải file .txt lên
              </button>
              <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
            </div>
          )}

          {/* CSV TAB */}
          {tab === "csv" && (
            <div>
              <div
                className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-5xl mb-3">📄</div>
                {fileName ? (
                  <p className="font-bold text-green-600">✓ {fileName}</p>
                ) : (
                  <>
                    <p className="font-bold text-gray-700">Nhấn để chọn file CSV hoặc TXT</p>
                    <p className="text-sm text-gray-400 mt-1">Hỗ trợ dấu phân cách: dấu phẩy (,) hoặc tab</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />

              <div className="mt-4 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Ví dụ nội dung CSV:</p>
                <pre className="text-xs font-mono text-gray-600">{`word,definition,ipa,wordType,exampleEn,exampleVi\nabandon,bỏ rơi,/əˈbændən/,verb,He abandoned the car.,Anh ta bỏ lại chiếc xe.`}</pre>
              </div>
            </div>
          )}

          {/* EXCEL TAB */}
          {tab === "excel" && (
            <div>
              <div
                className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-5xl mb-3">📊</div>
                {fileName ? (
                  <p className="font-bold text-green-600">✓ {fileName}</p>
                ) : (
                  <>
                    <p className="font-bold text-gray-700">Nhấn để chọn file Excel</p>
                    <p className="text-sm text-gray-400 mt-1">Hỗ trợ .xlsx và .xls — Sheet đầu tiên sẽ được đọc</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />

              <div className="mt-4 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Cấu trúc file Excel:</p>
                <table className="text-xs font-mono w-full border-collapse">
                  <thead>
                    <tr className="bg-green-100">
                      {["A: word", "B: definition", "C: ipa", "D: wordType", "E: exampleEn", "F: exampleVi"].map(h => (
                        <th key={h} className="border border-green-200 px-2 py-1 text-left text-green-800">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {["abandon", "bỏ rơi", "/əˈbændən/", "verb", "He abandoned...", "Anh ta bỏ..."].map((v, i) => (
                        <td key={i} className="border border-gray-200 px-2 py-1 text-gray-600">{v}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-2">* Hàng đầu có thể là tiêu đề hoặc dữ liệu — hệ thống tự nhận biết.</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-700">Xem trước</h3>
                <span className="text-sm bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">
                  {preview.length} từ hợp lệ
                </span>
              </div>
              <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {["Từ vựng", "Nghĩa", "IPA", "Loại từ", "Ví dụ EN"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-bold text-gray-800">{item.word}</td>
                        <td className="px-4 py-2 text-gray-600">{item.definition}</td>
                        <td className="px-4 py-2 font-mono text-blue-600 text-xs">{item.ipa || "—"}</td>
                        <td className="px-4 py-2">
                          {item.wordType
                            ? <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{item.wordType}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2 text-gray-500 italic text-xs truncate max-w-[200px]">{item.exampleEn || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition-colors">
            Huỷ
          </button>
          <button
            onClick={handleConfirm}
            disabled={preview.length === 0}
            className={`px-8 py-2.5 rounded-xl font-bold text-white transition-all active:scale-95 ${
              preview.length > 0
                ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            ✅ Thêm {preview.length > 0 ? `${preview.length} từ` : ""} vào bài học
          </button>
        </div>
      </div>
    </div>
  );
}
