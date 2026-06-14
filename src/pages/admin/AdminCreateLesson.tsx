import React, { useState, useEffect } from 'react';
import { lessonService } from '../../service/lessonService';
import type { VocabItem } from '../../service/lessonService';
import { folderService } from '../../service/folderService';
import { useNavigate } from 'react-router-dom';
import SuccessModal from '../../components/modal/SuccessModal';
import ImportVocabModal from '../../components/create/ImportVocabModal';
import AddVocabModal from '../../components/modal/AddVocabModal';
import { toast } from 'react-hot-toast';
import type { Folder } from '../../types/folder';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { ChevronLeft, Plus, Zap, LayoutGrid, Table, BookOpen, Trash2, Rocket, ChevronDown } from 'lucide-react';
import { FOLDER_ICONS } from '../../components/ui/folderIcons';

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
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [autoFetchIpa, setAutoFetchIpa] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    const saved = localStorage.getItem("lesson_editor_view_mode");
    return (saved === "table" || saved === "card") ? saved : "card";
  });
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
  const [newFolderIcon, setNewFolderIcon] = useState('Folder');
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
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button 
            onClick={() => navigate('/admin')} 
            className="text-claude-text-3 hover:text-claude-accent transition-colors mt-1"
            title="Quay lại"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-claude-text">Tạo bài học Hệ thống</h1>
            <p className="text-claude-text-2 text-sm mt-1">Xuất bản nội dung chính thức cho toàn bộ cộng đồng.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            onClick={() => setShowAddModal(true)}
            variant="primary"
            size="md"
            icon={<Plus className="h-4 w-4" />}
          >
            Thêm từ
          </Button>
          <Button
            type="button"
            onClick={() => setShowImportModal(true)}
            variant="secondary"
            size="md"
            icon={<Zap className="h-4 w-4" />}
          >
            Import nhanh
          </Button>
        </div>
      </div>

      {/* Settings Card */}
      <div className="bg-claude-surface rounded-claude-md shadow-claude-sm border border-claude-border p-6 mb-6">
        <h2 className="font-bold text-claude-text-2 mb-4 text-xs uppercase tracking-widest">Thông tin bài học</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* Title */}
          <Input
            label="Tiêu đề *"
            placeholder="VD: English Idioms for IELTS"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />

          {/* Folder */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-claude-text">Thư mục hệ thống</label>
              <button
                onClick={() => setShowFolderModal(true)}
                className="text-xs font-bold text-claude-accent hover:underline transition"
              >
                + Tạo thư mục mới
              </button>
            </div>
            <div className="relative">
              <select
                value={selectedFolderId || ""}
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                className="appearance-none w-full bg-claude-surface border border-claude-border rounded-claude pl-3 pr-10 py-2.5 text-sm text-claude-text focus:outline-none focus:ring-2 focus:ring-claude-accent cursor-pointer transition-colors duration-150"
                disabled={loading}
              >
                <option value="">-- Không có thư mục --</option>
                {officialFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-claude-text-3">
                <ChevronDown className="w-4 h-4" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-sm font-medium text-claude-text">Mô tả bài học (tùy chọn)</label>
          <textarea
            className="w-full bg-claude-surface border border-claude-border rounded-claude p-4 font-medium text-claude-text-2 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent transition-all resize-none text-sm"
            rows={2}
            placeholder="Mô tả nội dung hoặc cấp độ của bài học này..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Auto IPA */}
        <label className="flex items-center gap-3 cursor-pointer w-fit select-none">
          <input
            type="checkbox"
            checked={autoFetchIpa}
            onChange={(e) => setAutoFetchIpa(e.target.checked)}
            className="w-4 h-4 rounded text-claude-accent focus:ring-claude-accent accent-claude-accent border-claude-border"
          />
          <span className="text-sm font-bold text-claude-accent">Tự động tra phiên âm IPA</span>
        </label>
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
                ? "bg-claude-surface text-claude-accent shadow-claude-sm border border-claude-border"
                : "border-transparent text-claude-text-2 hover:text-claude-text"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Dạng thẻ
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("table");
              localStorage.setItem("lesson_editor_view_mode", "table");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-claude border text-xs md:text-sm font-bold transition-all ${
              viewMode === "table"
                ? "bg-claude-surface text-claude-accent shadow-claude-sm border border-claude-border"
                : "border-transparent text-claude-text-2 hover:text-claude-text"
            }`}
          >
            <Table className="w-4 h-4" /> Dạng bảng (Excel)
          </button>
        </div>
      </div>

      {/* Vocab Items */}
      {vocabItems.length === 0 ? (
        <div className="bg-claude-surface rounded-claude-md border-2 border-dashed border-claude-border p-12 text-center mb-6 shadow-claude-sm">
          <BookOpen className="w-12 h-12 text-claude-text-3 mx-auto mb-4" strokeWidth={1.2} />
          <h3 className="text-lg font-bold text-claude-text mb-1">Chưa có từ vựng nào</h3>
          <p className="text-claude-text-2 text-sm mb-4">
            Hãy thêm từ vựng mới hoặc nhập liệu nhanh từ Excel/Text để bắt đầu.
          </p>
          <Button
            type="button"
            onClick={() => setShowAddModal(true)}
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
          >
            Thêm từ đầu tiên
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
                    disabled={loading}
                    className="text-claude-text-3 hover:text-claude-error transition-colors"
                    title="Xóa từ này"
                  >
                    <Trash2 className="h-5 w-5" strokeWidth={2} />
                  </button>
                )}
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Từ vựng *"
                  placeholder="e.g. abandon"
                  value={item.word}
                  onChange={(e) => updateItem(index, "word", e.target.value)}
                  disabled={loading}
                  className="font-semibold"
                />

                <Input
                  label="Nghĩa tiếng Việt *"
                  placeholder="e.g. bỏ rơi, từ bỏ"
                  value={item.definition}
                  onChange={(e) => updateItem(index, "definition", e.target.value)}
                  disabled={loading}
                />

                <Input
                  label="Phiên âm (IPA)"
                  placeholder="e.g. /əˈbændən/"
                  value={item.ipa || ""}
                  onChange={(e) => updateItem(index, "ipa", e.target.value)}
                  disabled={loading || autoFetchIpa}
                  className="font-mono text-claude-accent"
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-claude-text">Loại từ</label>
                  <div className="relative">
                    <select
                      className="appearance-none w-full bg-claude-surface border border-claude-border rounded-claude pl-3 pr-10 py-2.5 text-sm text-claude-text focus:outline-none focus:ring-2 focus:ring-claude-accent cursor-pointer transition-colors duration-150"
                      value={item.wordType || ""}
                      onChange={(e) => updateItem(index, "wordType", e.target.value)}
                      disabled={loading}
                    >
                      <option value="">-- Chọn loại từ --</option>
                      {WORD_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-claude-text-3">
                      <ChevronDown className="w-4 h-4" strokeWidth={2} />
                    </div>
                  </div>
                </div>

                <Input
                  label="Ví dụ tiếng Anh"
                  placeholder="e.g. He abandoned his car on the highway."
                  value={item.exampleEn || ""}
                  onChange={(e) => updateItem(index, "exampleEn", e.target.value)}
                  disabled={loading}
                />

                <Input
                  label="Ví dụ tiếng Việt"
                  placeholder="e.g. Anh ấy đã bỏ lại xe của mình trên đường cao tốc."
                  value={item.exampleVi || ""}
                  onChange={(e) => updateItem(index, "exampleVi", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-claude-surface rounded-claude-md shadow-claude-sm border border-claude-border mb-6 max-w-full">
          <table className="w-full border-collapse min-w-[800px] text-sm text-left">
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
                      disabled={loading}
                    />
                  </td>
                  <td className="p-1 border-r border-claude-border">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:bg-claude-surface rounded text-sm text-claude-text transition-all"
                      placeholder="e.g. bỏ rơi, từ bỏ"
                      value={item.definition}
                      onChange={(e) => updateItem(index, "definition", e.target.value)}
                      disabled={loading}
                    />
                  </td>
                  <td className="p-1 border-r border-claude-border">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:bg-claude-surface rounded font-mono text-sm text-claude-accent transition-all"
                      placeholder="e.g. /əˈbændən/"
                      value={item.ipa || ""}
                      onChange={(e) => updateItem(index, "ipa", e.target.value)}
                      disabled={loading || autoFetchIpa}
                    />
                  </td>
                  <td className="p-1 border-r border-claude-border">
                    <div className="relative">
                      <select
                        className="appearance-none w-full bg-transparent pl-2 pr-6 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:bg-claude-surface rounded text-sm text-claude-text cursor-pointer transition-all"
                        value={item.wordType || ""}
                        onChange={(e) => updateItem(index, "wordType", e.target.value)}
                        disabled={loading}
                      >
                        <option value="" className="bg-claude-surface text-claude-text">Loại từ</option>
                        {WORD_TYPES.map((t) => (
                          <option key={t} value={t} className="bg-claude-surface text-claude-text">{t}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-claude-text-3">
                        <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
                      </div>
                    </div>
                  </td>
                  <td className="p-1 border-r border-claude-border">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:bg-claude-surface rounded text-sm text-claude-text-2 transition-all"
                      placeholder="e.g. He abandoned..."
                      value={item.exampleEn || ""}
                      onChange={(e) => updateItem(index, "exampleEn", e.target.value)}
                      disabled={loading}
                    />
                  </td>
                  <td className="p-1 border-r border-claude-border">
                    <input
                      type="text"
                      className="w-full bg-transparent px-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:bg-claude-surface rounded text-sm text-claude-text-2 transition-all"
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
                        className="text-claude-text-3 hover:text-claude-error transition-colors p-1.5 rounded hover:bg-claude-error-light inline-flex items-center justify-center"
                        title="Xóa từ này"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
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
        className="w-full py-4 rounded-claude-md border-2 border-dashed border-claude-accent/30 text-claude-accent font-bold hover:bg-claude-accent-lighter hover:border-claude-accent/50 transition-colors mb-8 flex items-center justify-center gap-2"
      >
        <Plus className="h-5 w-5" strokeWidth={2} />
        Thêm từ mới
      </button>

      {/* Submit Bar */}
      <div className="bg-claude-surface rounded-claude-md shadow-claude-sm border border-claude-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-claude-text-2 text-sm">
          Số từ hợp lệ: <span className="font-bold text-claude-accent text-lg">{validWords.length}</span>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/admin')}
            variant="secondary"
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || validWords.length === 0 || !title.trim()}
            loading={loading}
            variant="primary"
            icon={<Rocket className="h-4 w-4" />}
          >
            Xuất bản bài học
          </Button>
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

      <AddVocabModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(item) => setVocabItems((prev) => [...prev, item])}
        WORD_TYPES={WORD_TYPES}
      />

      {/* Create Folder Modal */}
      <Modal
        open={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        title="Thư mục mới"
        size="sm"
      >
        <form onSubmit={handleCreateFolder} className="space-y-6">
          <Input
            label="Tên thư mục"
            placeholder="VD: Cambridge Vocabulary"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            required
            autoFocus
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-claude-text">Icon đại diện</label>
            <div className="grid grid-cols-5 gap-2">
              {FOLDER_ICONS.slice(0, 10).map(({ name, label, Icon }) => (
                <button
                  key={name}
                  type="button"
                  title={label}
                  onClick={() => setNewFolderIcon(name)}
                  className={`flex items-center justify-center p-3 rounded-claude transition-all border-2 ${
                    newFolderIcon === name 
                      ? 'bg-claude-accent-lighter border-claude-accent' 
                      : 'bg-claude-surface-2 border-transparent hover:border-claude-border'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${ newFolderIcon === name ? 'text-claude-accent' : 'text-claude-text-2'}`}
                    strokeWidth={1.8}
                  />
                </button>
              ))}
            </div>
          </div>
          <Button
            type="submit"
            disabled={isCreatingFolder}
            loading={isCreatingFolder}
            variant="primary"
            className="w-full py-3"
          >
            Xác nhận tạo
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCreateLesson;
