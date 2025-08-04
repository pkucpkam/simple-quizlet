import { useState } from "react";

export default function CreateLesson() {
  const [title, setTitle] = useState("");
  const [rawVocab, setRawVocab] = useState("");
  const [parsedWords, setParsedWords] = useState<
    { word: string; definition: string }[]
  >([]);

  const handleCreate = () => {
    const lines = rawVocab.split("\n");
    const words = lines
      .map((line) => {
        const [word, definition] = line.split(",").map((s) => s.trim());
        if (!word || !definition) return null;
        return { word, definition };
      })
      .filter(Boolean) as { word: string; definition: string }[];

    setParsedWords(words);

    // 👉 Ở đây bạn có thể gọi API hoặc lưu vào context/localStorage
    console.log("Tiêu đề:", title);
    console.log("Danh sách từ:", words);
    alert(`Đã tạo bài học "${title}" với ${words.length} từ`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-8">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Tạo bài học mới</h1>

      <label className="block mb-2 font-semibold">Tiêu đề bài học</label>
      <input
        type="text"
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
        placeholder="VD: Unit 4: Travel Vocabulary"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label className="block mb-2 font-semibold">Từ vựng (1 dòng 1 từ, cách nhau bởi dấu phẩy)</label>
      <textarea
        rows={8}
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4 font-mono"
        placeholder={`abandon, bỏ rơi\nbeneficial, có lợi`}
        value={rawVocab}
        onChange={(e) => setRawVocab(e.target.value)}
      ></textarea>

      <button
        onClick={handleCreate}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
      >
        Tạo bài học
      </button>

      {parsedWords.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Xem trước:</h2>
          <ul className="list-disc list-inside text-gray-700">
            {parsedWords.map((item, idx) => (
              <li key={idx}>
                <span className="font-medium">{item.word}</span>: {item.definition}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
