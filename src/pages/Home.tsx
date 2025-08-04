import LessonCard from "../components/LessonCard";
import { lessons } from "../data/lessons";

export default function Home() {
  const handleView = (id: string) => {
    alert(`Xem bài học ${id}`);
    // navigate(`/lesson/${id}`) nếu bạn có routing
  };

  const handlePractice = (id: string) => {
    alert(`Luyện tập bài học ${id}`);
  };

  const handleDelete = (id: string) => {
    alert(`Xoá bài học ${id}`);
  };

  return (
    <div className="p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-blue-700">Danh sách bài học</h1>
      <div className="flex flex-col items-center gap-6 w-full">
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
