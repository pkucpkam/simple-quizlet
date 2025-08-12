import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { lessonService } from "../../service/lessonService";
import EditableCard from "../../components/edit/EditedCard";

interface Vocab {
  word: string;
  definition: string;
}

export default function EditLesson() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [title, setTitle] = useState("");
  const [words, setWords] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true);
        const lesson = await lessonService.getLesson(lessonId!); 
        setTitle(lesson.title);
        setWords(lesson.vocabulary || []);
      } catch {
        setError("Không thể tải bài học");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  const handleChangeWord = (index: number, newWord: string, newDefinition: string) => {
    setWords((prev) =>
      prev.map((item, i) =>
        i === index ? { word: newWord, definition: newDefinition } : item
      )
    );
  };

  const handleDeleteWord = (index: number) => {
    setWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddWord = () => {
    setWords((prev) => [...prev, { word: "", definition: "" }]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      await lessonService.updateLesson(lessonId!, title, words);
      alert("Cập nhật thành công!");
    } catch {
      setError("Lỗi khi lưu bài học.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center">Đang tải...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Chỉnh sửa bài học</h1>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 w-full mb-6"
        placeholder="Tiêu đề bài học"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {words.map((word, index) => (
          <EditableCard
            key={index}
            word={word.word}
            definition={word.definition}
            onChange={(w, d) => handleChangeWord(index, w, d)}
            onDelete={() => handleDeleteWord(index)}
          />
        ))}
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={handleAddWord}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          + Thêm từ mới
        </button>
        <button
          onClick={handleSave}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded ${
            saving ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={saving}
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}
