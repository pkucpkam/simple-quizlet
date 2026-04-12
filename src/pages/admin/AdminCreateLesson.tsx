import React, { useState, useEffect } from 'react';
import { lessonService } from '../../service/lessonService';
import { folderService } from '../../service/folderService';
import { useNavigate } from 'react-router-dom';
import WordPreview from '../../components/create/WordPreview';
import SuccessModal from '../../components/modal/SuccessModal';
import { toast } from 'react-hot-toast';
import type { Folder } from '../../types/folder';

interface DictionaryPhonetic {
  text?: string;
}

const AdminCreateLesson: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rawVocab, setRawVocab] = useState("");
  const [parsedWords, setParsedWords] = useState<{ word: string; definition: string; ipa?: string }[]>([]);
  const [autoFetchIpa, setAutoFetchIpa] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
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

  const handleRawVocabChange = (value: string) => {
    setRawVocab(value);
    const lines = value.split("\n");
    const words = lines
      .map((line) => {
        const [word, definition] = line.split(",").map((s) => s.trim());
        if (!word || !definition) return null;
        return { word, definition };
      })
      .filter(Boolean) as { word: string; definition: string }[];
    setParsedWords(words);
  };

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
      // Refresh list and select new folder
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
    if (!title || parsedWords.length === 0) {
      toast.error("Vui lòng nhập tiêu đề và ít nhất một từ vựng.");
      return;
    }

    setLoading(true);
    try {
      let wordsToSave = [...parsedWords];

      if (autoFetchIpa) {
        toast.loading('Đang tra cứu phiên âm...', { id: 'ipa-fetch' });
        wordsToSave = await Promise.all(
          wordsToSave.map(async (item) => {
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
        false, // NOT private for admin lessons
        selectedFolderId || undefined,
        true // IS OFFICIAL
      );

      setShowModal(true);
      setTitle("");
      setDescription("");
      setRawVocab("");
      setParsedWords([]);
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
        <div className="mb-8 text-center md:text-left">
            <button onClick={() => navigate('/admin')} className="text-blue-600 font-bold hover:underline mb-4 inline-flex items-center gap-2 group">
               <span className="transition-transform group-hover:-translate-x-1">←</span> Quay lại bảng điều khiển
            </button>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Tạo bài học Hệ thống</h1>
            <p className="mt-3 text-lg text-gray-500 font-medium">Xuất bản nội dung chính thức cho toàn bộ cộng đồng.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100 p-8 md:p-12 border border-gray-100 transition-all duration-500 hover:shadow-blue-200">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Tiêu đề bài học</label>
                    <input
                        type="text"
                        className="w-full border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 p-4 font-bold text-gray-800 transition-all"
                        placeholder="VD: English Idioms for IELTS"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
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
                        className="w-full border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 p-4 font-bold text-gray-800 transition-all cursor-pointer appearance-none bg-no-repeat bg-[right_1.5rem_center] bg-[length:1rem]"
                        style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`}}
                        disabled={loading}
                    >
                        <option value="">-- Không có thư mục --</option>
                        {officialFolders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                            {folder.icon} {folder.name}
                        </option>
                        ))}
                    </select>
                </div>
           </div>

           <div className="mb-10 space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mô tả bài học (Tùy chọn)</label>
                <textarea
                    className="w-full border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 p-4 font-medium text-gray-600 transition-all resize-none"
                    rows={2}
                    placeholder="Mô tả nội dung hoặc cấp độ của bài học này..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                />
           </div>

           <div className="mb-10">
              <div className="flex justify-between items-center mb-4 px-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Danh sách từ vựng</label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-blue-600 hover:text-blue-800 transition">
                    <input
                        type="checkbox"
                        checked={autoFetchIpa}
                        onChange={(e) => setAutoFetchIpa(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-2 border-blue-200 text-blue-600 focus:ring-blue-500 transition-all"
                    />
                    Tự động thêm IPA
                </label>
              </div>
              <textarea
                rows={12}
                className="w-full border-2 border-gray-100 rounded-3xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 p-6 font-mono text-sm leading-relaxed bg-gray-50/50 transition-all"
                placeholder={`abandon, bỏ rơi\nbeneficial, có lợi\n...`}
                value={rawVocab}
                onChange={(e) => handleRawVocabChange(e.target.value)}
                disabled={loading}
              />
              <div className="mt-4 flex items-center gap-2 text-gray-400 ml-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <span className="text-xs font-bold italic">Sử dụng định dạng "từ, nghĩa" — mỗi từ trên một hàng</span>
              </div>
           </div>

           <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-50">
                <button
                    onClick={() => navigate('/admin')}
                    className="px-8 py-4 text-gray-400 font-black uppercase tracking-widest hover:text-gray-600 transition"
                    disabled={loading}
                >
                    Hủy bỏ
                </button>
                <button
                    onClick={handleCreate}
                    className={`relative overflow-hidden bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-95 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={loading}
                >
                    <span className={loading ? "opacity-0" : "opacity-100"}>Xuất bản bài học</span>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </button>
           </div>
        </div>

        <div className="mt-16">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 text-center">Xem trước bài học</h3>
            <WordPreview words={parsedWords} />
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showModal}
        title={title}
        wordCount={parsedWords.length}
        onClose={() => setShowModal(false)}
      />

      {/* Quick Create Folder Modal */}
      {showFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="bg-blue-600 p-8 text-white relative">
                      <button 
                        onClick={() => setShowFolderModal(false)}
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                      <h2 className="text-2xl font-black mb-1">Thư mục mới</h2>
                      <p className="text-blue-100 text-sm font-bold opacity-80 uppercase tracking-widest">Tạo không gian hệ thống</p>
                  </div>
                  <form onSubmit={handleCreateFolder} className="p-8 space-y-6">
                      <div className="space-y-2">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Tên thư mục</label>
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
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Icon đại diện</label>
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
