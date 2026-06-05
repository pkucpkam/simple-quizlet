import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { lessonService } from "../service/lessonService";
import type { VocabItem } from "../service/lessonService";
import { folderService } from "../service/folderService";
import SuccessModal from "../components/modal/SuccessModal";
import ImportVocabModal from "../components/create/ImportVocabModal";
import AddVocabModal from "../components/modal/AddVocabModal";
import type { Folder } from "../types/folder";

const WORD_TYPES = ["noun", "verb", "adjective", "adverb", "phrase", "idiom", "other"];

const emptyWord = (): VocabItem => ({
  word: "",
  definition: "",
  ipa: "",
  wordType: "",
  exampleEn: "",
  exampleVi: "",
});

export default function CreateLesson() {
  const [searchParams] = useSearchParams();
  const folderIdFromUrl = searchParams.get("folderId");

  const [title, setTitle] = useState("");
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [autoFetchIpa, setAutoFetchIpa] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    const saved = localStorage.getItem("lesson_editor_view_mode");
    return (saved === "table" || saved === "card") ? saved : "card";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showIpaInfoModal, setShowIpaInfoModal] = useState(false);
  const [showPrivateInfoModal, setShowPrivateInfoModal] = useState(false);
  const [showFolderInfoModal, setShowFolderInfoModal] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderIdFromUrl);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);


  useEffect(() => {
    const loadFolders = async (username: string) => {
      try {
        const fetchedFolders = await folderService.getMyFolders(username);
        
        if (folderIdFromUrl) {
          try {
            const specificFolder = await folderService.getFolder(folderIdFromUrl);
            if (specificFolder && !fetchedFolders.some(f => f.id === specificFolder.id)) {
              fetchedFolders.unshift(specificFolder);
            }
          } catch (err) {
            console.error("Error fetching folder from URL:", err);
          }
        }

        setFolders(fetchedFolders);
      } catch (error) {
        console.error("Error loading folders:", error);
      }
    };

    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserEmail(parsed.email);
        loadFolders(parsed.username || parsed.email);
      } catch {
        setUserEmail(null);
      }
    }
  }, [folderIdFromUrl]);

  const updateItem = (index: number, field: keyof VocabItem, value: string) => {
    setVocabItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };


  const removeWord = (index: number) => {
    setVocabItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = (items: VocabItem[]) => {
    setVocabItems((prev) => {
      // Remove empty trailing placeholders before merging
      const existing = prev.filter((v) => v.word.trim() || v.definition.trim());
      return [...existing, ...items];
    });
  };

  const validWords = vocabItems.filter((v) => v.word.trim() && v.definition.trim());

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError("");

      if (!title.trim()) throw new Error("Vui lòng nhập tiêu đề bài học.");
      if (validWords.length === 0) throw new Error("Vui lòng nhập ít nhất một từ vựng.");

      let wordsToSave = [...validWords];

      if (autoFetchIpa) {
        wordsToSave = await Promise.all(
          wordsToSave.map(async (item) => {
            if (item.ipa) return item;
            try {
              const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(item.word)}`);
              if (!res.ok) return item;
              const data = await res.json();
              const phonetics = data[0]?.phonetics;
              const phonetic = phonetics?.find((p: { text?: string }) => p.text)?.text || data[0]?.phonetic;
              return phonetic ? { ...item, ipa: phonetic } : item;
            } catch {
              return item;
            }
          })
        );
      }

      const storedUser = sessionStorage.getItem("user");
      let username = userEmail;
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          username = parsed.username || parsed.email;
        } catch {
          username = userEmail;
        }
      }

      await lessonService.createLesson(
        title,
        username ?? "",
        wordsToSave,
        "",
        isPrivate,
        selectedFolderId || undefined
      );

      setShowModal(true);
      setTitle("");
      setVocabItems([emptyWord(), emptyWord()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  };

  if (!userEmail) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">Tạo bài học mới</h1>
        <p className="text-red-500 text-lg">
          Bạn cần <a href="/login" className="underline text-blue-600">đăng nhập</a> để tạo bài học.
        </p>
      </div>
    );
  }

  const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">Tạo bài học mới</h1>
            <p className="text-gray-500 mt-1">Thêm từ vựng kèm đầy đủ thông tin để học hiệu quả hơn</p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all whitespace-nowrap shadow-md shadow-blue-100"
            >
              ➕ Thêm từ
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-blue-200 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 hover:border-blue-300 transition-all whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              ⚡ Import nhanh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-widest">Cài đặt bài học</h2>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề bài học <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-gray-800 font-medium"
            placeholder="VD: Unit 4 – Travel Vocabulary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {/* Private */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} disabled={loading} className="w-4 h-4 accent-blue-600" />
            <span className="font-semibold text-gray-700 text-sm">Riêng tư</span>
            <button type="button" onClick={() => setShowPrivateInfoModal(true)} className="text-gray-400 hover:text-blue-500"><InfoIcon /></button>
          </label>

          {/* Auto IPA */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={autoFetchIpa} onChange={(e) => setAutoFetchIpa(e.target.checked)} disabled={loading} className="w-4 h-4 accent-blue-600" />
            <span className="font-semibold text-gray-700 text-sm">Tự động thêm phiên âm (IPA)</span>
            <button type="button" onClick={() => setShowIpaInfoModal(true)} className="text-gray-400 hover:text-blue-500"><InfoIcon /></button>
          </label>
        </div>

        {/* Folder */}
        {folders.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-semibold text-gray-700">Thư mục (tùy chọn)</label>
              <button type="button" onClick={() => setShowFolderInfoModal(true)} className="text-gray-400 hover:text-blue-500"><InfoIcon /></button>
            </div>
            <select
              value={selectedFolderId || ""}
              onChange={(e) => setSelectedFolderId(e.target.value || null)}
              className="border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm w-full md:w-auto"
              disabled={loading}
            >
              <option value="">Không chọn thư mục</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>{folder.icon} {folder.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <span className="font-bold text-gray-700 text-sm md:text-base ml-2">Danh sách từ vựng ({vocabItems.length})</span>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setViewMode("card");
              localStorage.setItem("lesson_editor_view_mode", "card");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
              viewMode === "card"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🗂️ Dạng thẻ
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("table");
              localStorage.setItem("lesson_editor_view_mode", "table");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
              viewMode === "table"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📊 Dạng bảng (Excel)
          </button>
        </div>
      </div>

      {/* Vocab Items */}
      {vocabItems.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center mb-6 shadow-sm">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-lg font-bold text-gray-700 mb-1">Chưa có từ vựng nào</h3>
          <p className="text-gray-500 text-sm mb-4">
            Hãy thêm từ vựng mới hoặc nhập liệu nhanh từ Excel/Text để bắt đầu.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
          >
            ➕ Thêm từ đầu tiên
          </button>
        </div>
      ) : viewMode === "card" ? (
        <div className="space-y-4 mb-6">
          {vocabItems.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{index + 1}</span>
                {vocabItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWord(index)}
                    disabled={loading}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Xóa từ này"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Word */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Từ vựng <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors font-semibold text-gray-800"
                    placeholder="e.g. abandon"
                    value={item.word}
                    onChange={(e) => updateItem(index, "word", e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Definition */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nghĩa tiếng Việt <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-gray-800"
                    placeholder="e.g. bỏ rơi, từ bỏ"
                    value={item.definition}
                    onChange={(e) => updateItem(index, "definition", e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* IPA */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Phiên âm (IPA)</label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors font-mono text-blue-600"
                    placeholder="e.g. /əˈbændən/"
                    value={item.ipa || ""}
                    onChange={(e) => updateItem(index, "ipa", e.target.value)}
                    disabled={loading || autoFetchIpa}
                  />
                </div>

                {/* Word Type */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Loại từ</label>
                  <select
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-gray-700 bg-white"
                    value={item.wordType || ""}
                    onChange={(e) => updateItem(index, "wordType", e.target.value)}
                    disabled={loading}
                  >
                    <option value="">-- Chọn loại từ --</option>
                    {WORD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Example EN */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Ví dụ tiếng Anh</label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-gray-700"
                    placeholder="e.g. He abandoned his car on the highway."
                    value={item.exampleEn || ""}
                    onChange={(e) => updateItem(index, "exampleEn", e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Example VI */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Ví dụ tiếng Việt</label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-gray-700"
                    placeholder="e.g. Anh ấy đã bỏ lại xe của mình trên đường cao tốc."
                    value={item.exampleVi || ""}
                    onChange={(e) => updateItem(index, "exampleVi", e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-150 mb-6 max-w-full">
          <table className="w-full border-collapse min-w-[800px] text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-12 border-r border-gray-200">#</th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200">Từ vựng <span className="text-red-500">*</span></th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200">Nghĩa tiếng Việt <span className="text-red-500">*</span></th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 w-36">Phiên âm (IPA)</th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 w-36">Loại từ</th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200">Ví dụ tiếng Anh</th>
                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200">Ví dụ tiếng Việt</th>
                <th className="p-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {vocabItems.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 text-center text-sm font-bold text-gray-400 border-r border-gray-200 bg-gray-50/30">{index + 1}</td>
                  <td className="p-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2.5 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white rounded font-semibold text-sm text-gray-800 transition-all"
                      placeholder="e.g. abandon"
                      value={item.word}
                      onChange={(e) => updateItem(index, "word", e.target.value)}
                      disabled={loading}
                    />
                  </td>
                  <td className="p-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2.5 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white rounded text-sm text-gray-800 transition-all"
                      placeholder="e.g. bỏ rơi, từ bỏ"
                      value={item.definition}
                      onChange={(e) => updateItem(index, "definition", e.target.value)}
                      disabled={loading}
                    />
                  </td>
                  <td className="p-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2.5 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white rounded font-mono text-sm text-blue-600 transition-all"
                      placeholder="e.g. /əˈbændən/"
                      value={item.ipa || ""}
                      onChange={(e) => updateItem(index, "ipa", e.target.value)}
                      disabled={loading || autoFetchIpa}
                    />
                  </td>
                  <td className="p-1 border-r border-gray-200">
                    <select
                      className="w-full bg-transparent px-2 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white rounded text-sm text-gray-700 bg-white cursor-pointer transition-all"
                      value={item.wordType || ""}
                      onChange={(e) => updateItem(index, "wordType", e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Loại từ</option>
                      {WORD_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2.5 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white rounded text-sm text-gray-700 transition-all"
                      placeholder="e.g. He abandoned..."
                      value={item.exampleEn || ""}
                      onChange={(e) => updateItem(index, "exampleEn", e.target.value)}
                      disabled={loading}
                    />
                  </td>
                  <td className="p-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2.5 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white rounded text-sm text-gray-700 transition-all"
                      placeholder="e.g. Anh ấy đã bỏ lại..."
                      value={item.exampleVi || ""}
                      onChange={(e) => updateItem(index, "exampleVi", e.target.value)}
                      disabled={loading}
                    />
                  </td>
                  <td className="p-2 text-center">
                    {vocabItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWord(index)}
                        disabled={loading}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 inline-flex items-center justify-center"
                        title="Xóa từ này"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Word Button */}
      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        disabled={loading}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-blue-300 text-blue-600 font-bold hover:bg-blue-50 hover:border-blue-400 transition-colors mb-8 flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Thêm từ mới
      </button>

      {/* Summary & Submit */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-gray-500 text-sm">
          Số từ hợp lệ: <span className="font-bold text-blue-600 text-lg">{validWords.length}</span>
        </div>
        <button
          onClick={handleCreate}
          disabled={loading || validWords.length === 0 || !title.trim()}
          className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 ${loading || validWords.length === 0 || !title.trim()
              ? "bg-gray-300 cursor-not-allowed shadow-none"
              : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
            }`}
        >
          {loading ? "Đang tạo..." : "🚀 Tạo bài học"}
        </button>
      </div>

      <SuccessModal
        isOpen={showModal}
        title={title}
        wordCount={validWords.length}
        onClose={() => setShowModal(false)}
      />

      {/* Info Modals */}
      {showIpaInfoModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl mx-4">
            <h2 className="text-xl font-bold text-blue-700 mb-4">Tính năng thêm phiên âm</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">Hệ thống tự động tìm phiên âm IPA qua từ điển trực tuyến. Nếu bạn đã nhập IPA thủ công, IPA đó sẽ được giữ nguyên.</p>
            <div className="flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors" onClick={() => setShowIpaInfoModal(false)}>Đã hiểu</button>
            </div>
          </div>
        </div>
      )}

      {showPrivateInfoModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl mx-4">
            <h2 className="text-xl font-bold text-blue-700 mb-4">Bài học riêng tư</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">Chỉ bạn mới thấy bài học này. Người dùng khác sẽ không tìm thấy nó.</p>
            <div className="flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors" onClick={() => setShowPrivateInfoModal(false)}>Đã hiểu</button>
            </div>
          </div>
        </div>
      )}

      {showFolderInfoModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl mx-4">
            <h2 className="text-xl font-bold text-blue-700 mb-4">Thư mục</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">Bạn có thể xếp bài học vào thư mục để dễ quản lý theo chủ đề hoặc tuần học.</p>
            <div className="flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors" onClick={() => setShowFolderInfoModal(false)}>Đã hiểu</button>
            </div>
          </div>
        </div>
      )}

      <ImportVocabModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      <AddVocabModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(item) => setVocabItems((prev) => [...prev, item])}
        WORD_TYPES={WORD_TYPES}
      />
    </div>
  );
}
