import { useState, useEffect } from "react";
import { lessonService } from "../service/lessonService";
import ReviewLessonCard from "../components/review/ReviewLessonCard";

interface Lesson {
  id: string;
  title: string;
  creator: string;
  vocabId: string;
  createdAt: Date;
  description: string;
  wordCount: number;
}

export default function ReviewLessonPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        const fetchedLessons = await lessonService.getLessons();
        setLessons(fetchedLessons);
      } catch (err) {
        setError("Không thể tải danh sách bài học. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const lesson = lessons.find((l) => l.id === id);
      if (lesson) {
        await lessonService.deleteLesson(lesson.id, lesson.vocabId);
        setLessons(lessons.filter((l) => l.id !== id));
        alert(`Đã xóa bài ôn tập ${id}`);
      }
    } catch (err) {
      setError("Không thể xóa bài ôn tập. Vui lòng thử lại.");
    }
  };

  return (
    <div className="p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-blue-700">Bài ôn tập của tôi</h1>

      {loading && <p className="text-gray-500">Đang tải...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="flex flex-col items-center gap-6 w-full">
        {lessons.length === 0 && !loading && !error && (
          <p className="text-gray-500">Bạn chưa có bài ôn tập nào.</p>
        )}
        {lessons.map((lesson) => (
          <ReviewLessonCard
            key={lesson.id}
            lesson={lesson}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
