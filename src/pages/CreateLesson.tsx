import { useState, useEffect } from "react";
import { lessonService } from "../service/lessonService";
import { folderService } from "../service/folderService";
import WordPreview from "../components/create/WordPreview";
import SuccessModal from "../components/modal/SuccessModal";
import type { Folder } from "../types/folder";

export default function CreateLesson() {
  const [title, setTitle] = useState("");
  const [rawVocab, setRawVocab] = useState("");
  const [parsedWords, setParsedWords] = useState<
    { word: string; definition: string; ipa?: string }[]
  >([]);
  const [autoFetchIpa, setAutoFetchIpa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showIpaInfoModal, setShowIpaInfoModal] = useState(false);
  const [showPrivateInfoModal, setShowPrivateInfoModal] = useState(false);
  const [showFolderInfoModal, setShowFolderInfoModal] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);


  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserEmail(parsed.email);
        // Load folders
        loadFolders(parsed.username || parsed.email);
      } catch {
        setUserEmail(null);
      }
    }
  }, []);

  const loadFolders = async (username: string) => {
    try {
      const fetchedFolders = await folderService.getMyFolders(username);
      setFolders(fetchedFolders);
    } catch (error) {
      console.error("Error loading folders:", error);
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

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError("");

      if (!title || parsedWords.length === 0) {
        throw new Error("Vui lòng nhập tiêu đề và ít nhất một từ vựng.");
      }

      let wordsToSave = [...parsedWords];

      if (autoFetchIpa) {
        wordsToSave = await Promise.all(
          wordsToSave.map(async (item) => {
            try {
              const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(item.word)}`);
              if (!res.ok) return item;
              const data = await res.json();
              const phonetics = data[0]?.phonetics;
              // find the first non-empty text
              const phonetic = phonetics?.find((p: { text?: string }) => p.text)?.text || data[0]?.phonetic;
              if (phonetic) {
                return { ...item, ipa: phonetic };
              }
              return item;
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
      setRawVocab("");
      setParsedWords([]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã xảy ra lỗi không xác định.");
      }
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

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-8">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Tạo bài học mới</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="mr-2"
              disabled={loading}
            />
            <span className="font-semibold">Đặt bài học ở chế độ riêng tư</span>
          </label>
          <button 
            type="button"
            className="ml-2 text-gray-400 hover:text-blue-500 transition-colors"
            onClick={() => setShowPrivateInfoModal(true)}
            title="Xem giải thích"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoFetchIpa}
              onChange={(e) => setAutoFetchIpa(e.target.checked)}
              className="mr-2"
              disabled={loading}
            />
            <span className="font-semibold">Tự động thêm phiên âm (IPA)</span>
          </label>
          <button 
            type="button"
            className="ml-2 text-gray-400 hover:text-blue-500 transition-colors"
            onClick={() => setShowIpaInfoModal(true)}
            title="Xem giải thích"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Folder Selection */}
      {folders.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <label className="font-semibold cursor-pointer">Chọn thư mục (tùy chọn)</label>
            <button 
              type="button"
              className="ml-2 text-gray-400 hover:text-blue-500 transition-colors"
              onClick={() => setShowFolderInfoModal(true)}
              title="Xem giải thích"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
            </button>
          </div>
          <select
            value={selectedFolderId || ""}
            onChange={(e) => setSelectedFolderId(e.target.value || null)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            disabled={loading}
          >
            <option value="">Không chọn thư mục</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.icon} {folder.name}
              </option>
            ))}
          </select>
        </div>
      )}


      <label className="block mb-2 font-semibold">Tiêu đề bài học</label>
      <input
        type="text"
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
        placeholder="VD: Unit 4: Travel Vocabulary"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loading}
      />

      <label className="block mb-2 font-semibold">
        Từ vựng (1 dòng 1 từ, cách nhau bởi dấu phẩy)
      </label>
      <textarea
        rows={8}
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4 font-mono"
        placeholder={`abandon, bỏ rơi\nbeneficial, có lợi`}
        value={rawVocab}
        onChange={(e) => handleRawVocabChange(e.target.value)}
        disabled={loading}
      ></textarea>

      <button
        onClick={handleCreate}
        className={`bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded ${loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        disabled={loading}
      >
        {loading ? "Đang tạo..." : "Tạo bài học"}
      </button>

      <WordPreview words={parsedWords} />
      <SuccessModal
        isOpen={showModal}
        title={title}
        wordCount={parsedWords.length}
        onClose={() => setShowModal(false)}
      />

      {showIpaInfoModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg relative mx-4">
            <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              Tính năng thêm phiên âm
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Tính năng này hỗ trợ tự động tìm kiếm cách phát âm chuẩn (kí hiệu IPA) thông qua từ điển trực tuyến và lưu cùng từ vựng.
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Ví dụ từ <strong>hello</strong> sẽ có phiên âm <span className="font-mono bg-gray-100 px-1 rounded text-blue-600">/həˈloʊ/</span>.</li>
              <li>Giúp người học dễ dàng đọc đúng khi ôn tập.</li>
              <li>Cần một chút thời gian để hệ thống gọi API tra cứu.</li>
            </ul>
            <div className="flex justify-end">
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition-colors"
                onClick={() => setShowIpaInfoModal(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrivateInfoModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg relative mx-4">
            <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              Bài học riêng tư
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Tính năng này cho phép bạn ẩn bài học để chỉ có một mình bạn mới có thể xem và thực hành bài kiểm tra.
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Người dùng khác sẽ không tìm thấy bài học này trên hệ thống.</li>
              <li>Bạn có thể xem lại trong trang "Bài học của tôi".</li>
              <li>Phù hợp với các ghi chú học tập mang tính cá nhân.</li>
            </ul>
            <div className="flex justify-end">
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition-colors"
                onClick={() => setShowPrivateInfoModal(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {showFolderInfoModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg relative mx-4">
            <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              Tính năng thư mục
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Bạn có thể tự do phân loại bài học vừa tạo vào các thư mục đã có để dễ dàng quản lý.
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Giúp quản lý theo từng môn học, từng chủ đề hoặc tuần học.</li>
              <li>Lưu ý: Nếu bạn chưa tạo thư mục nào trong trang cá nhân, chức năng này sẽ không hiển thị.</li>
            </ul>
            <div className="flex justify-end">
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition-colors"
                onClick={() => setShowFolderInfoModal(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
