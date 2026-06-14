import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { folderService } from "../service/folderService";
import type { Folder } from "../types/folder";
import type { Lesson } from "../service/lessonService";
import { toast } from "react-hot-toast";
import ExerciseSelectionModal from "../components/review/ExerciseSelectionModal";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonCard } from "../components/ui/Skeleton";

const BackIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const FolderView: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLessonForReview, setSelectedLessonForReview] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolderData = async () => {
      if (!folderId) return;
      try {
        setLoading(true);
        const folderData = await folderService.getFolder(folderId);
        if (!folderData) { toast.error("Không tìm thấy thư mục"); navigate("/"); return; }
        setFolder(folderData);
        const lessonsData = await folderService.getLessonsInFolder(folderId);
        setLessons(lessonsData);
      } catch (error) {
        console.error("Error fetching folder:", error);
        toast.error("Lỗi khi tải dữ liệu thư mục");
      } finally { setLoading(false); }
    };
    fetchFolderData();
  }, [folderId, navigate]);

  if (loading) {
    return (
      <div className="w-full py-6 animate-fade-in">
        <div className="max-w-5xl mx-auto px-6">
          <div className="h-6 w-32 skeleton rounded mb-6" />
          <div className="h-28 skeleton rounded-claude-md mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!folder) return null;

  return (
    <div className="w-full pb-12 animate-fade-in">
      {/* Header Banner - Full Width */}
      <div className="w-full bg-gradient-to-br from-stone-800 to-stone-900 text-white py-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-48 h-48 bg-claude-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="mb-5 flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs font-medium"
          >
            <BackIcon />
            Quay lại
          </button>

          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-claude-lg text-4xl flex-shrink-0 border border-white/10">
              {folder.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white">{folder.name}</h1>
                {folder.isOfficial && <Badge variant="official" size="sm">Official</Badge>}
              </div>
              <p className="text-sm text-white/60">
                {folder.description || "Bộ sưu tập bài học được tuyển chọn"}
              </p>
              <p className="text-xs text-white/40 mt-1">{lessons.length} bài học</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Constrained to max-w-5xl mx-auto */}
      <div className="max-w-5xl mx-auto px-6">
        {/* Action bar */}
        <div className="py-3 border-b border-claude-border bg-transparent flex items-center justify-between mt-6">
          <span className="text-sm text-claude-text-2">{lessons.length} bài học trong thư mục này</span>
          <button
            onClick={() => navigate(`/create-lesson?folderId=${folderId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-claude-accent border border-claude-accent/30 rounded-claude hover:bg-claude-accent-lighter transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Thêm bài học
          </button>
        </div>

        {/* Lessons */}
        <div className="py-6">
          {lessons.length === 0 ? (
            <div className="bg-claude-surface border border-claude-border rounded-claude-md">
              <EmptyState
                title="Chưa có bài học nào"
                description="Thư mục này chưa có bài học. Hãy thêm bài học vào thư mục."
                action={{ label: "Thêm bài học", onClick: () => navigate(`/create-lesson?folderId=${folderId}`) }}
                icon={<svg className="h-10 w-10 text-claude-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="group bg-claude-surface border border-claude-border rounded-claude-md p-5 hover:border-claude-accent hover:shadow-claude transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium px-2 py-0.5 bg-claude-accent-light text-claude-accent rounded-full">
                      {lesson.wordCount} từ
                    </span>
                    <span className="text-xs text-claude-text-3">{new Date(lesson.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-claude-text group-hover:text-claude-accent transition-colors mb-1 line-clamp-2">
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-claude-text-2 line-clamp-2 mb-4">
                    {lesson.description || "Bấm để bắt đầu học bài này."}
                  </p>

                  <div className="grid grid-cols-3 gap-1.5">
                    <Link
                      to={`/lesson/${lesson.id}`}
                      className="col-span-3 py-2 text-xs font-medium text-center text-claude-text-2 border border-claude-border rounded-claude hover:bg-claude-surface-2 transition-colors"
                    >
                      Xem chi tiết
                    </Link>
                    <button
                      onClick={() => navigate(`/study/${lesson.id}`)}
                      className="py-2 text-xs font-medium text-center text-white bg-claude-accent rounded-claude hover:bg-claude-accent-2 transition-colors"
                    >
                      Học ngay
                    </button>
                    <button
                      onClick={() => setSelectedLessonForReview(lesson.id)}
                      className="py-2 text-xs font-medium text-center text-claude-success bg-claude-success-light rounded-claude hover:bg-claude-success hover:text-white transition-colors"
                    >
                      Ôn tập
                    </button>
                    <button
                      onClick={() => navigate(`/test/${lesson.id}`)}
                      className="py-2 text-xs font-medium text-center text-claude-warning bg-claude-warning-light rounded-claude hover:bg-claude-warning hover:text-white transition-colors"
                    >
                      Kiểm tra
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ExerciseSelectionModal
        open={selectedLessonForReview !== null}
        onClose={() => setSelectedLessonForReview(null)}
        lessonId={selectedLessonForReview || ""}
      />
    </div>
  );
};

export default FolderView;
