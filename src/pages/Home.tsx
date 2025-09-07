import { useState, useEffect } from "react";
import LessonCard from "../components/LessonCard";
import { lessonService } from "../service/lessonService";

interface Lesson {
  id: string;
  title: string;
  creator: string;
  vocabId: string;
  createdAt: Date;
  description: string;
  wordCount: number;
  isPrivate: boolean;
}

export default function Home() {
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
      await lessonService.deleteLessonById(id);
      setLessons((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleTogglePrivacy = async (id: string, isPrivate: boolean) => {
    try {
      await lessonService.togglePrivacyLesson(id, isPrivate);
      setLessons((prev) =>
        prev.map((l) => (l.id === id ? { ...l, isPrivate } : l))
      );
    } catch (error) {
      setError((error as Error).message);
    }
  };


  return (
    <div className="p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-blue-700">Danh sách bài học</h1>

      {loading && <p className="text-gray-500">Đang tải...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="flex flex-col items-center gap-6 w-full">
        {lessons.length === 0 && !loading && !error && (
          <p className="text-gray-500">Chưa có bài học nào.</p>
        )}
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            onDelete={handleDelete}
            onTogglePrivacy={handleTogglePrivacy}
          />
        ))}
      </div>
    </div>
  );
}