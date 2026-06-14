import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lessonService } from "../../service/lessonService";
import type { VocabItem } from "../../service/lessonService";
import { folderService } from "../../service/folderService";
import SuccessModal from "../../components/modal/SuccessModal";
import ImportVocabModal from "../../components/create/ImportVocabModal";
import AddVocabModal from "../../components/modal/AddVocabModal";
import type { Folder } from "../../types/folder";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import FolderSelect from "../../components/ui/FolderSelect";

const WORD_TYPES = ["noun", "verb", "adjective", "adverb", "phrase", "idiom", "other"];

const emptyWord = (): VocabItem => ({
  word: "",
  definition: "",
  ipa: "",
  wordType: "",
  exampleEn: "",
  exampleVi: "",
});

export default function EditLesson() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([emptyWord(), emptyWord()]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [autoFetchIpa, setAutoFetchIpa] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    const saved = localStorage.getItem("lesson_editor_view_mode");
    return (saved === "table" || saved === "card") ? saved : "card";
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showIpaInfoModal, setShowIpaInfoModal] = useState(false);
  const [showPrivateInfoModal, setShowPrivateInfoModal] = useState(false);
  const [showFolderInfoModal, setShowFolderInfoModal] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;
      try {
        setLoading(true);
        const lesson = await lessonService.getLesson(lessonId);
        setTitle(lesson.title);
        setVocabItems(lesson.vocabulary && lesson.vocabulary.length > 0 ? lesson.vocabulary : [emptyWord(), emptyWord()]);
        setIsPrivate(lesson.isPrivate || false);
        setSelectedFolderId(lesson.folderId || null);
        
        // Security check: only creator can edit
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.username !== lesson.creator && parsed.email !== lesson.creator) {
                toast.error("Bạn không có quyền chỉnh sửa bài học này");
                navigate(`/lesson/${lessonId}`);
            }
        }
      } catch {
        setError("Không thể tải bài học");
        toast.error("Lỗi khi tải bài học");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, navigate]);

  const loadFolders = async (username: string) => {
    try {
      const fetchedFolders = await folderService.getMyFolders(username);
      setFolders(fetchedFolders);
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  };

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
      const currentItems = [...prev.filter((v) => v.word.trim() || v.definition.trim())];
      const merged = [...currentItems];
      const added: VocabItem[] = [];

      items.forEach((newItem) => {
        const index = merged.findIndex(
          (item) => item.word.toLowerCase().trim() === newItem.word.toLowerCase().trim()
        );
        if (index !== -1) {
          merged[index] = {
            ...merged[index],
            ...Object.fromEntries(Object.entries(newItem).filter(([, v]) => v !== undefined && v !== "")),
          };
        } else {
          added.push(newItem);
        }
      });

      return [...merged, ...added];
    });
    toast.success(`Đã xử lý ${items.length} từ vựng`);
  };

  const vocabItemsToText = () => {
    return vocabItems
      .filter((v) => v.word.trim() || v.definition.trim())
      .map((v) => `${v.word} ; ${v.definition} ; ${v.ipa || ""} ; ${v.wordType || ""} ; ${v.exampleEn || ""} ; ${v.exampleVi || ""}`)
      .join("\n");
  };

  const validWords = vocabItems.filter((v) => v.word.trim() && v.definition.trim());

  const handleUpdate = async () => {
    try {
      setSaving(true);
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

      await lessonService.updateLesson(
        lessonId!,
        title,
        wordsToSave,
        "",
        isPrivate,
        selectedFolderId || undefined
      );

      toast.success("Cập nhật bài học thành công!");
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-claude-border border-t-claude-accent mb-4"></div>
        <p className="text-claude-text-2 font-medium">Đang tải dữ liệu bài học...</p>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-claude-accent mb-4">Chỉnh sửa bài học</h1>
        <p className="text-claude-error text-lg font-medium">
          Bạn cần <a href="/login" className="underline text-claude-accent font-bold">đăng nhập</a> để chỉnh sửa bài học.
        </p>
      </div>
    );
  }

  const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <button 
                onClick={() => navigate(`/lesson/${lessonId}`)}
                className="text-claude-text-3 hover:text-claude-accent transition-colors mt-1"
                title="Quay lại"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-claude-text">Chỉnh sửa bài học</h1>
              <p className="text-claude-text-2 text-sm mt-1">Cập nhật nội dung bài học của bạn</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              onClick={() => setShowAddModal(true)}
              variant="primary"
              size="md"
            >
              ➕ Thêm từ
            </Button>
            <Button
              type="button"
              onClick={() => setShowImportModal(true)}
              variant="secondary"
              size="md"
            >
              ⚡ Nhập liệu nhanh
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-claude-error-light border border-claude-error/20 text-claude-error px-4 py-3 rounded-claude mb-6 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Settings Card */}
      <div className="bg-claude-surface rounded-claude-md shadow-claude-sm border border-claude-border p-6 mb-6">
        <h2 className="font-bold text-claude-text-2 mb-4 text-xs uppercase tracking-widest">Cài đặt bài học</h2>

        {/* Title */}
        <div className="mb-4">
          <Input
            label="Tiêu đề bài học *"
            type="text"
            placeholder="VD: Unit 4 – Travel Vocabulary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {/* Private */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={isPrivate} 
              onChange={(e) => setIsPrivate(e.target.checked)} 
              disabled={saving} 
              className="w-4 h-4 rounded text-claude-accent focus:ring-claude-accent accent-claude-accent border-claude-border" 
            />
            <span className="font-semibold text-claude-text text-sm">Riêng tư</span>
            <button type="button" onClick={() => setShowPrivateInfoModal(true)} className="text-claude-text-3 hover:text-claude-accent transition-colors"><InfoIcon /></button>
          </label>

          {/* Auto IPA */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoFetchIpa} 
              onChange={(e) => setAutoFetchIpa(e.target.checked)} 
              disabled={saving} 
              className="w-4 h-4 rounded text-claude-accent focus:ring-claude-accent accent-claude-accent border-claude-border" 
            />
            <span className="font-semibold text-claude-text text-sm">Tự động thêm phiên âm (IPA)</span>
            <button type="button" onClick={() => setShowIpaInfoModal(true)} className="text-claude-text-3 hover:text-claude-accent transition-colors"><InfoIcon /></button>
          </label>
        </div>

        {/* Folder */}
        {folders.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-sm font-semibold text-claude-text">Thư mục (tùy chọn)</label>
              <button type="button" onClick={() => setShowFolderInfoModal(true)} className="text-claude-text-3 hover:text-claude-accent transition-colors"><InfoIcon /></button>
            </div>
            <FolderSelect
              folders={folders}
              selectedId={selectedFolderId}
              onChange={setSelectedFolderId}
              disabled={saving}
            />
          </div>
        )}
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center justify-between mb-4 bg-claude-surface p-3 rounded-claude-md border border-claude-border shadow-claude-sm">
        <span className="font-bold text-claude-text text-sm md:text-base ml-2">Danh sách từ vựng ({vocabItems.length})</span>
        <div className="flex bg-claude-sidebar p-1 rounded-claude border border-claude-border">
          <button
            type="button"
            onClick={() => {
              setViewMode("card");
              localStorage.setItem("lesson_editor_view_mode", "card");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-claude border text-xs md:text-sm font-bold transition-all ${
              viewMode === "card"
                ? "bg-claude-surface text-claude-accent shadow-claude-sm border-claude-border"
                : "border-transparent text-claude-text-2 hover:text-claude-text"
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-claude border text-xs md:text-sm font-bold transition-all ${
              viewMode === "table"
                ? "bg-claude-surface text-claude-accent shadow-claude-sm border-claude-border"
                : "border-transparent text-claude-text-2 hover:text-claude-text"
            }`}
          >
            📊 Dạng bảng (Excel)
          </button>
        </div>
      </div>

      {/* Vocab Items */}
      {vocabItems.length === 0 ? (
        <div className="bg-claude-surface rounded-claude-md border-2 border-dashed border-claude-border p-12 text-center mb-6 shadow-claude-sm">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-lg font-bold text-claude-text mb-1">Chưa có từ vựng nào</h3>
          <p className="text-claude-text-2 text-sm mb-4">
            Hãy thêm từ vựng mới hoặc nhập liệu nhanh từ Excel/Text để bắt đầu.
          </p>
          <Button
            type="button"
            onClick={() => setShowAddModal(true)}
            variant="primary"
          >
            ➕ Thêm từ đầu tiên
          </Button>
        </div>
      ) : viewMode === "card" ? (
        <div className="space-y-4 mb-6">
          {vocabItems.map((item, index) => (
            <div key={index} className="bg-claude-surface rounded-claude-md shadow-claude-sm border border-claude-border overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-claude-surface-2 border-b border-claude-border">
                <span className="text-sm font-bold text-claude-text-3 uppercase tracking-widest">{index + 1}</span>
                {vocabItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWord(index)}
                    disabled={saving}
                    className="text-claude-text-3 hover:text-claude-error transition-colors"
                    title="Xóa từ này"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Từ vựng *"
                  placeholder="e.g. abandon"
                  value={item.word}
                  onChange={(e) => updateItem(index, "word", e.target.value)}
                  disabled={saving}
                  className="font-semibold"
                />

                <Input
                  label="Nghĩa tiếng Việt *"
                  placeholder="e.g. bỏ rơi, từ bỏ"
                  value={item.definition}
                  onChange={(e) => updateItem(index, "definition", e.target.value)}
                  disabled={saving}
                />

                <Input
                  label="Phiên âm (IPA)"
                  placeholder="e.g. /əˈbændən/"
                  value={item.ipa || ""}
                  onChange={(e) => updateItem(index, "ipa", e.target.value)}
                  disabled={saving || autoFetchIpa}
                  className="font-mono text-claude-accent"
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-claude-text">Loại từ</label>
                  <select
                    className="w-full bg-claude-surface border border-claude-border rounded-claude px-3 py-2 text-sm text-claude-text focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent transition-colors bg-white"
                    value={item.wordType || ""}
                    onChange={(e) => updateItem(index, "wordType", e.target.value)}
                    disabled={saving}
                  >
                    <option value="">-- Chọn loại từ --</option>
                    {WORD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Ví dụ tiếng Anh"
                  placeholder="e.g. He abandoned his car on the highway."
                  value={item.exampleEn || ""}
                  onChange={(e) => updateItem(index, "exampleEn", e.target.value)}
                  disabled={saving}
                />

                <Input
                  label="Ví dụ tiếng Việt"
                  placeholder="e.g. Anh ấy đã bỏ lại xe của mình trên đường cao tốc."
                  value={item.exampleVi || ""}
                  onChange={(e) => updateItem(index, "exampleVi", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-claude-surface rounded-claude-md shadow-claude-sm border border-claude-border mb-6 max-w-full">
          <table className="w-full border-collapse min-w-[800px] text-left text-sm">
            <thead>
              <tr className="bg-claude-surface-2 border-b border-claude-border">
                <th className="p-3 text-center text-xs font-bold text-claude-text-2 uppercase tracking-wider w-12 border-r border-claude-border">#</th>
                <th className="p-3 text-xs font-bold text-claude-text-2 uppercase tracking-wider border-r border-claude-border">Từ vựng *</th>
                <th className="p-3 text-xs font-bold text-claude-text-2 uppercase tracking-wider border-r border-claude-border">Nghĩa tiếng Việt *</th>
                <th className="p-3 text-xs font-bold text-claude-text-2 uppercase tracking-wider border-r border-claude-border w-36">Phiên âm (IPA)</th>
                <th className="p-3 text-xs font-bold text-claude-text-2 uppercase tracking-wider border-r border-claude-border w-36">Loại từ</th>
                <th className="p-3 text-xs font-bold text-claude-text-2 uppercase tracking-wider border-r border-claude-border">Ví dụ tiếng Anh</th>
                <th className="p-3 text-xs font-bold text-claude-text-2 uppercase tracking-wider border-r border-claude-border">Ví dụ tiếng Việt</th>
                <th className="p-3 text-center text-xs font-bold text-claude-text-2 uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-claude-border">
              {vocabItems.map((item, index) => (
                <tr key={index} className="hover:bg-claude-surface-2 transition-colors">
                  <td className="p-3 text-center font-bold text-claude-text-3 border-r border-claude-border bg-claude-surface-2/30">{index + 1}</td>
                  <td className="p-1 border-r border-claude-border">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:bg-claude-surface rounded text-sm text-claude-text font-semibold transition-all"
                      placeholder="e.g. abandon"
                      value={item.word}
                      onChange={(e) => updateItem(index, "word", e.target.value)}
                      disabled={saving}
                    />
                  </td>
                  <td className="p-1 border-r border-claude-border">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:bg-claude-surface rounded text-sm text-claude-text transition-all"
                      placeholder="e.g. bỏ rơi, từ bỏ"
                      value={item.definition}
                      onChange={(e) => updateItem(index, "definition", e.target.value)}
                      disabled={saving}
                    />
                  </td>
                  <td className="p-1 border-r border-claude-border">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:bg-claude-surface rounded font-mono text-sm text-claude-accent transition-all"
                      placeholder="e.g. /əˈbændən/"
                      value={item.ipa || ""}
                      onChange={(e) => updateItem(index, "ipa", e.target.value)}
                      disabled={saving || autoFetchIpa}
                    />
                  </td>
                  <td className="p-1 border-r border-claude-border">
                    <select
                      className="w-full bg-transparent px-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:bg-claude-surface rounded text-sm text-claude-text bg-white cursor-pointer transition-all"
                      value={item.wordType || ""}
                      onChange={(e) => updateItem(index, "wordType", e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Loại từ</option>
                      {WORD_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1 border-r border-claude-border">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:bg-claude-surface rounded text-sm text-claude-text-2 transition-all"
                      placeholder="e.g. He abandoned..."
                      value={item.exampleEn || ""}
                      onChange={(e) => updateItem(index, "exampleEn", e.target.value)}
                      disabled={saving}
                    />
                  </td>
                  <td className="p-1 border-r border-claude-border">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:bg-claude-surface rounded text-sm text-claude-text-2 transition-all"
                      placeholder="e.g. Anh ấy đã bỏ lại..."
                      value={item.exampleVi || ""}
                      onChange={(e) => updateItem(index, "exampleVi", e.target.value)}
                      disabled={saving}
                    />
                  </td>
                  <td className="p-2 text-center">
                    {vocabItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWord(index)}
                        disabled={saving}
                        className="text-claude-text-3 hover:text-claude-error transition-colors p-1.5 rounded hover:bg-claude-error-light inline-flex items-center justify-center"
                        title="Xóa từ này"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          disabled={saving}
          className="flex-1 py-4 rounded-claude-md border-2 border-dashed border-claude-accent/30 text-claude-accent font-bold hover:bg-claude-accent-lighter hover:border-claude-accent/50 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Thêm từ mới
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Bạn có chắc chắn muốn xóa tất cả từ vựng hiện tại?")) {
              setVocabItems([]);
            }
          }}
          disabled={saving}
          className="py-4 px-6 rounded-claude-md border-2 border-dashed border-claude-error/30 text-claude-error font-bold hover:bg-claude-error-light hover:border-claude-error/50 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Xóa hết
        </button>
      </div>

      {/* Summary & Submit */}
      <div className="bg-claude-surface rounded-claude-md shadow-claude-sm border border-claude-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-claude-text-2 text-sm">
          Số từ hợp lệ: <span className="font-bold text-claude-accent text-lg">{validWords.length}</span>
        </div>
        <div className="flex gap-4">
            <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/lesson/${lessonId}`)}
            >
                Hủy
            </Button>
            <Button
                onClick={handleUpdate}
                disabled={saving || validWords.length === 0 || !title.trim()}
                loading={saving}
                variant="primary"
            >
                💾 Lưu thay đổi
            </Button>
        </div>
      </div>

      <SuccessModal
        isOpen={showModal}
        title={title}
        wordCount={validWords.length}
        onClose={() => {
            setShowModal(false);
            navigate(`/lesson/${lessonId}`);
        }}
      />

      {/* Info Modals */}
      <Modal
        open={showIpaInfoModal}
        onClose={() => setShowIpaInfoModal(false)}
        title="Tính năng thêm phiên âm"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-claude-text-2 leading-relaxed">
            Hệ thống tự động tìm phiên âm IPA qua từ điển trực tuyến. Nếu bạn đã nhập IPA thủ công, IPA đó sẽ được giữ nguyên.
          </p>
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setShowIpaInfoModal(false)}>Đã hiểu</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showPrivateInfoModal}
        onClose={() => setShowPrivateInfoModal(false)}
        title="Bài học riêng tư"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-claude-text-2 leading-relaxed">
            Chỉ bạn mới thấy bài học này. Người dùng khác sẽ không tìm thấy nó.
          </p>
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setShowPrivateInfoModal(false)}>Đã hiểu</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showFolderInfoModal}
        onClose={() => setShowFolderInfoModal(false)}
        title="Thư mục"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-claude-text-2 leading-relaxed">
            Bạn có thể xếp bài học vào thư mục để dễ quản lý theo chủ đề hoặc tuần học.
          </p>
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setShowFolderInfoModal(false)}>Đã hiểu</Button>
          </div>
        </div>
      </Modal>

      <ImportVocabModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        initialText={vocabItemsToText()}
      />

      <AddVocabModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(item: VocabItem) => setVocabItems((prev) => [...prev, item])}
        WORD_TYPES={WORD_TYPES}
      />
    </div>
  );
}
