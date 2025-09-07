import { useState, useEffect } from "react";
import { lessonService } from "../service/lessonService";
import WordPreview from "../components/create/WordPreview";
import SuccessModal from "../components/modal/SuccessModal";

export default function CreateLesson() {
  const [title, setTitle] = useState("");
  const [rawVocab, setRawVocab] = useState("");
  const [parsedWords, setParsedWords] = useState<
    { word: string; definition: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);


  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserEmail(parsed.email);
      } catch {
        setUserEmail(null);
      }
    }
  }, []);

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
        parsedWords,
        "",
        isPrivate
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

      <label className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="mr-2"
          disabled={loading}
        />
        <span className="font-semibold">Đặt bài học ở chế độ riêng tư</span>
      </label>


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
    </div>
  );
}
