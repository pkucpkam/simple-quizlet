import type { Lesson } from "../types/lesson";

interface Props {
  lesson: Lesson;
  onView: (id: string) => void;
  onPractice: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function LessonCard({ lesson, onView, onPractice, onDelete }: Props) {
  return (
    <div className="w-full max-w-3xl bg-white shadow-md rounded-xl px-6 py-5 mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Thông tin bài học */}
      <div className="flex-1">
        <h2 className="text-2xl font-semibold text-blue-600">{lesson.title}</h2>
        <p className="text-gray-600 mt-1">{lesson.description}</p>
        <p className="text-sm text-gray-400 mt-1">Từ vựng: {lesson.wordCount} từ</p>
      </div>

      {/* Các nút hành động */}
      <div className="flex gap-2 flex-wrap justify-end">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          onClick={() => onView(lesson.id)}
        >
          Xem
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          onClick={() => onPractice(lesson.id)}
        >
          Luyện tập
        </button>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          onClick={() => onDelete(lesson.id)}
        >
          Xoá
        </button>
      </div>
    </div>
  );
}
