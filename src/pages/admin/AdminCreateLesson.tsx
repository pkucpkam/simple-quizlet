import React, { useState, useEffect } from 'react';
import { lessonService } from '../../service/lessonService';
import type { VocabItem } from '../../service/lessonService';
import { folderService } from '../../service/folderService';
import { useNavigate } from 'react-router-dom';
import SuccessModal from '../../components/modal/SuccessModal';
import ImportVocabModal from '../../components/create/ImportVocabModal';
import { toast } from 'react-hot-toast';
import type { Folder } from '../../types/folder';

interface DictionaryPhonetic {
  text?: string;
}

const WORD_TYPES = ["noun", "verb", "adjective", "adverb", "phrase", "idiom", "other"];

const emptyWord = (): VocabItem => ({
  word: "",
  definition: "",
  ipa: "",
  wordType: "",
  exampleEn: "",
  exampleVi: "",
});

const AdminCreateLesson: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([emptyWord(), emptyWord()]);
  const [autoFetchIpa, setAutoFetchIpa] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [officialFolders, setOfficialFolders] = useState<Folder[]>([]);

  // Folder modal state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserEmail(parsed.email);
      setUsername(parsed.username || parsed.email);
    } else {
      navigate('/login');
    }
    loadOfficialFolders();
  }, [navigate]);

  const loadOfficialFolders = async () => {
    try {
      const folders = await folderService.getOfficialFolders();
      setOfficialFolders(folders);
    } catch {
      toast.error('Không thể tải thư mục hệ thống');
    }
  };

  const updateItem = (index: number, field: keyof VocabItem, value: string) => {
    setVocabItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addWord = () => setVocabItems((prev) => [...prev, emptyWord()]);

  const removeWord = (index: number) => {
    setVocabItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = (items: VocabItem[]) => {
    setVocabItems((prev) => {
      const existing = prev.filter((v) => v.word.trim() || v.definition.trim());
      return [...existing, ...items];
    });
  };

  const validWords = vocabItems.filter((v) => v.word.trim() && v.definition.trim());

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    setIsCreatingFolder(true);
    try {
      const result = await folderService.createFolder(username || "Admin", {
        name: newFolderName,
        icon: newFolderIcon,
        isOfficial: true
      });
      toast.success('Đã tạo thư mục mới');
      setNewFolderName('');
      setShowFolderModal(false);
      const folders = await folderService.getOfficialFolders();
      setOfficialFolders(folders);
      setSelectedFolderId(result.folderId);
    } catch {
      toast.error('Lỗi khi tạo thư mục');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Vui lòng nhập tiêu đề bài học."); return; }
    if (validWords.length === 0) { toast.error("Vui lòng nhập ít nhất một từ vựng."); return; }

    setLoading(true);
    try {
      let wordsToSave = [...validWords];

      if (autoFetchIpa) {
        toast.loading('Đang tra cứu phiên âm...', { id: 'ipa-fetch' });
        wordsToSave = await Promise.all(
          wordsToSave.map(async (item) => {
            if (item.ipa) return item; // keep manually entered IPA
            try {
              const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(item.word)}`);
              if (!res.ok) return item;
              const data = await res.json();
              const phonetics = data[0]?.phonetics;
              const phonetic = phonetics?.find((p: DictionaryPhonetic) => p.text)?.text || data[0]?.phonetic;
              return phonetic ? { ...item, ipa: phonetic } : item;
            } catch {
              return item;
            }
          })
        );
        toast.dismiss('ipa-fetch');
      }

      await lessonService.createLesson(
        title,
        username || userEmail || "Admin",
        wordsToSave,
        description,
        false,             // NOT private
        selectedFolderId || undefined,
        true               // IS OFFICIAL
      );

      setShowModal(true);
      setTitle("");
      setDescription("");
      setVocabItems([emptyWord(), emptyWord()]);
      toast.success('Đã tạo bài học hệ thống!');
    } catch {
      toast.error("Đã xảy ra lỗi khi tạo bài học.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 relative">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button onClick={() => navigate('/admin')} className="text-blue-600 font-bold hover:underline mb-3 inline-flex items-center gap-2 group">
              <span className="transition-transform group-hover:-translate-x-1">←</span> Quay lại bảng điều khiển
            </button>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Tạo bài học Hệ thống</h1>
            <p className="mt-2 text-base text-gray-500 font-medium">Xuất bản nội dung chính thức cho toàn bộ cộng đồng.</p>
          </div>
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

        {/* Settings Card */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-50 border border-gray-100 p-8 mb-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Thông tin bài học</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Tiêu đề <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 p-4 font-bold text-gray-800 transition-all"
                placeholder="VD: English Idioms for IELTS"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Folder */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Thư mục hệ thống</label>
                <button
                  onClick={() => setShowFolderModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  + Tạo thư mục mới
                </button>
              </div>
              <select
                value={selectedFolderId || ""}
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                className="w-full border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 p-4 font-bold text-gray-800 transition-all cursor-pointer"
                disabled={loading}
              >
                <option value="">-- Không có thư mục --</option>
                {officialFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.icon} {folder.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 mb-4">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Mô tả bài học (tùy chọn)</label>
            <textarea
              className="w-full border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 p-4 font-medium text-gray-600 transition-all resize-none"
              rows={2}
              placeholder="Mô tả nội dung hoặc cấp độ của bài học này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Auto IPA */}
          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={autoFetchIpa}
              onChange={(e) => setAutoFetchIpa(e.target.checked)}
              className="w-5 h-5 rounded-lg border-2 border-blue-200 text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
            <span className="text-sm font-bold text-blue-700">Tự động tra phiên âm IPA</span>
          </label>
        </div>

        {/* Vocab Items */}
        <div className="space-y-4 mb-6">
          {vocabItems.map((item, index) => (
            <div key={index} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between px-6 py-3 bg-gray-50/80 border-b border-gray-100">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{index + 1}</span>
                {vocabItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWord(index)}
                    disabled={loading}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Word */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Từ vựng <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 font-bold text-gray-800 transition-all"
                    placeholder="e.g. abandon"
                    value={item.word}
                    onChange={(e) => updateItem(index, "word", e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Definition */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Nghĩa tiếng Việt <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 text-gray-800 transition-all"
                    placeholder="e.g. bỏ rơi, từ bỏ"
                    value={item.definition}
                    onChange={(e) => updateItem(index, "definition", e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* IPA */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Phiên âm (IPA)</label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 font-mono text-blue-600 transition-all"
                    placeholder="e.g. /əˈbændən/"
                    value={item.ipa || ""}
                    onChange={(e) => updateItem(index, "ipa", e.target.value)}
                    disabled={loading || autoFetchIpa}
                  />
                </div>

                {/* Word Type */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Loại từ</label>
                  <select
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 text-gray-700 bg-white transition-all"
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
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Ví dụ tiếng Anh</label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 text-gray-700 transition-all"
                    placeholder="e.g. He abandoned his car on the highway."
                    value={item.exampleEn || ""}
                    onChange={(e) => updateItem(index, "exampleEn", e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Example VI */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Ví dụ tiếng Việt</label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 text-gray-700 transition-all"
                    placeholder="e.g. Anh ấy đã bỏ lại xe trên đường cao tốc."
                    value={item.exampleVi || ""}
                    onChange={(e) => updateItem(index, "exampleVi", e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Word Button */}
        <button
          type="button"
          onClick={addWord}
          disabled={loading}
          className="w-full py-4 rounded-[1.5rem] border-2 border-dashed border-blue-200 text-blue-600 font-bold hover:bg-blue-50 hover:border-blue-400 transition-colors mb-8 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Thêm từ mới
        </button>

        {/* Submit Bar */}
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-gray-400 text-sm">
            Số từ hợp lệ: <span className="font-black text-blue-600 text-xl">{validWords.length}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="px-6 py-3 text-gray-400 font-black uppercase tracking-widest hover:text-gray-600 transition rounded-xl"
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || validWords.length === 0 || !title.trim()}
              className={`relative overflow-hidden px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 ${
                loading || validWords.length === 0 || !title.trim()
                  ? "bg-gray-300 cursor-not-allowed shadow-none"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
              }`}
            >
              <span className={loading ? "opacity-0" : "opacity-100"}>🚀 Xuất bản bài học</span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={showModal}
        title={title}
        wordCount={validWords.length}
        onClose={() => setShowModal(false)}
      />

      <ImportVocabModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 p-8 text-white relative">
              <button onClick={() => setShowFolderModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-2xl font-black mb-1">Thư mục mới</h2>
              <p className="text-blue-100 text-sm font-bold opacity-80 uppercase tracking-widest">Tạo không gian hệ thống</p>
            </div>
            <form onSubmit={handleCreateFolder} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Tên thư mục</label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 p-4 font-bold text-gray-800 transition-all"
                  placeholder="VD: Cambridge Vocabulary"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Icon đại diện</label>
                <div className="grid grid-cols-5 gap-3">
                  {['📁', '🎓', '📚', '🚀', '⭐'].map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewFolderIcon(icon)}
                      className={`text-2xl p-3 rounded-2xl transition-all border-2 ${newFolderIcon === icon ? 'bg-blue-50 border-blue-600' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={isCreatingFolder}
                className={`w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 ${isCreatingFolder ? 'opacity-50' : 'hover:bg-blue-700'}`}
              >
                {isCreatingFolder ? 'Đang tạo...' : 'Xác nhận tạo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCreateLesson;
