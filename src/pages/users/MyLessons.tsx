import { useState, useEffect } from "react";
import LessonCard from "../../components/LessonCard";
import { lessonService } from "../../service/lessonService"; // Điều chỉnh đường dẫn đến lessonService

interface Lesson {
  id: string;
  title: string;
  creator: string;
  vocabId: string;
  createdAt: Date;
  description: string;
  wordCount: number;
}

export default function MyLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyLessons = async () => {
      const storedUser = sessionStorage.getItem("user");
      console.log("[MyLessons] Found user in sessionStorage:", storedUser); // Debug

      if (!storedUser) {
        setError("Vui lòng đăng nhập để xem bài học của bạn.");
        setLoading(false);
        return;
      }

      let userEmail: string;
      try {
        const userData = JSON.parse(storedUser);
        userEmail = userData.email || "anonymous";
        console.log("[MyLessons] Parsed user email:", userEmail); // Debug
      } catch (err) {
        console.error("[MyLessons] Error parsing user data:", err); // Debug
        setError("Dữ liệu người dùng không hợp lệ. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedLessons = await lessonService.getMyLessons(userEmail);
        console.log("[MyLessons] Fetched lessons:", fetchedLessons); // Debug
        setLessons(fetchedLessons);
      } catch (err) {
        console.error("[MyLessons] Error fetching lessons:", err); // Debug
        setError("Không thể tải danh sách bài học. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyLessons();
  }, []);

  const handleView = (id: string) => {
    alert(`Xem bài học ${id}`);
    // navigate(`/lesson/${id}`) nếu bạn có routing
  };

  const handlePractice = (id: string) => {
    alert(`Luyện tập bài học ${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      const lesson = lessons.find((l) => l.id === id);
      if (lesson) {
        await lessonService.deleteLesson(lesson.id, lesson.vocabId);
        setLessons(lessons.filter((l) => l.id !== id));
        alert(`Đã xóa bài học ${id}`);
      }
    } catch (err) {
      console.error("[MyLessons] Error deleting lesson:", err); // Debug
      setError("Không thể xóa bài học. Vui lòng thử lại.");
    }
  };

  return (
    <div className="p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-blue-700">Bài học của tôi</h1>

      {loading && <p className="text-gray-500">Đang tải...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="flex flex-col items-center gap-6 w-full">
        {lessons.length === 0 && !loading && !error && (
          <p className="text-gray-500">Bạn chưa tạo bài học nào.</p>
        )}
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            onView={handleView}
            onPractice={handlePractice}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}