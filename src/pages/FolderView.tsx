import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { folderService } from "../service/folderService";
import type { Folder } from "../types/folder";
import type { Lesson } from "../service/lessonService";
import { toast } from "react-hot-toast";
import ExerciseSelectionModal from "../components/review/ExerciseSelectionModal";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonCard } from "../components/ui/Skeleton";
import { ArrowLeft, LayoutGrid, List, Plus, BookOpen } from "lucide-react";
import FolderIcon from "../components/ui/FolderIcon";

const BackIcon = () => <ArrowLeft className="h-4 w-4" strokeWidth={2} />;

const FolderView: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLessonForReview, setSelectedLessonForReview] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("folder_view_mode");
    return (saved === "list" || saved === "grid") ? saved : "grid";
  });

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
            <div
              className="flex items-center justify-center w-16 h-16 backdrop-blur-sm rounded-claude-lg flex-shrink-0 border border-white/10"
              style={{ backgroundColor: (folder.color || '#3B82F6') + '33' }}
            >
              <FolderIcon name={folder.icon} className="h-8 w-8" style={{ color: folder.color || 'white' }} />
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
          <div className="flex items-center gap-2">
            {lessons.length > 0 && (
              <div className="flex bg-claude-sidebar p-1 rounded-claude border border-claude-border mr-1">
                <button
                  onClick={() => {
                    setViewMode("grid");
                    localStorage.setItem("folder_view_mode", "grid");
                  }}
                  className={`p-1.5 rounded-claude border transition-all ${viewMode === "grid"
                    ? "bg-claude-surface text-claude-accent shadow-claude-sm border-claude-border"
                    : "border-transparent text-claude-text-3 hover:text-claude-text"
                    }`}
                  title="Xem dạng lưới"
                >
                  <LayoutGrid className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => {
                    setViewMode("list");
                    localStorage.setItem("folder_view_mode", "list");
                  }}
                  className={`p-1.5 rounded-claude border transition-all ${viewMode === "list"
                    ? "bg-claude-surface text-claude-accent shadow-claude-sm border-claude-border"
                    : "border-transparent text-claude-text-3 hover:text-claude-text"
                    }`}
                  title="Xem dạng danh sách"
                >
                  <List className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </div>
            )}
            <button
              onClick={() => navigate(`/create-lesson?folderId=${folderId}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-claude-accent border border-claude-accent/30 rounded-claude hover:bg-claude-accent-lighter transition-colors animate-fade-in"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Thêm bài học
            </button>
          </div>
        </div>

        {/* Lessons */}
        <div className="py-6">
          {lessons.length === 0 ? (
            <div className="bg-claude-surface border border-claude-border rounded-claude-md">
              <EmptyState
                title="Chưa có bài học nào"
                description="Thư mục này chưa có bài học. Hãy thêm bài học vào thư mục."
                action={{ label: "Thêm bài học", onClick: () => navigate(`/create-lesson?folderId=${folderId}`) }}
                icon={<BookOpen className="h-10 w-10 text-claude-text-3" strokeWidth={1.2} />}
              />
            </div>
          ) : (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
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
                      <Link to={`/lesson/${lesson.id}`} className="hover:underline">
                        {lesson.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-claude-text-2 line-clamp-2 mb-4">
                      {lesson.description || "Bấm để bắt đầu học bài này."}
                    </p>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => navigate(`/study/${lesson.id}`, { state: { from: location.pathname } })}
                        className="py-2 text-xs font-medium text-center text-blue-600 bg-blue-50 rounded-claude hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        Flashcard
                      </button>
                      <button
                        onClick={() => setSelectedLessonForReview(lesson.id)}
                        className="py-2 text-xs font-medium text-center text-claude-success bg-claude-success-light rounded-claude hover:bg-claude-success hover:text-white transition-colors"
                      >
                        Ôn tập
                      </button>
                      <button
                        onClick={() => navigate(`/test/${lesson.id}`, { state: { from: location.pathname } })}
                        className="py-2 text-xs font-medium text-center text-claude-warning bg-claude-warning-light rounded-claude hover:bg-claude-warning hover:text-white transition-colors"
                      >
                        Kiểm tra
                      </button>
                      <button
                        onClick={() => navigate(`/asteroid-match/${lesson.id}`, { state: { from: location.pathname } })}
                        className="py-2 text-xs font-medium text-center text-purple-600 bg-purple-50 rounded-claude hover:bg-purple-600 hover:text-white transition-colors"
                      >
                        Game
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 animate-fade-in">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="group bg-claude-surface border border-claude-border rounded-claude-md p-4 hover:border-claude-accent hover:shadow-claude transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-sm font-semibold text-claude-text group-hover:text-claude-accent transition-colors line-clamp-1">
                          <Link to={`/lesson/${lesson.id}`} className="hover:underline">
                            {lesson.title}
                          </Link>
                        </h3>
                        <span className="text-xs font-medium px-2 py-0.5 bg-claude-accent-light text-claude-accent rounded-full shrink-0">
                          {lesson.wordCount} từ
                        </span>
                      </div>
                      <p className="text-xs text-claude-text-2 line-clamp-1 mb-1">
                        {lesson.description || "Bấm để bắt đầu học bài này."}
                      </p>
                      <span className="text-[10px] text-claude-text-3">
                        Ngày tạo: {new Date(lesson.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigate(`/study/${lesson.id}`, { state: { from: location.pathname } })}
                        className="px-3 py-1.5 text-xs font-medium text-center text-blue-600 bg-blue-50 rounded-claude hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        Flashcard
                      </button>
                      <button
                        onClick={() => setSelectedLessonForReview(lesson.id)}
                        className="px-3 py-1.5 text-xs font-medium text-center text-claude-success bg-claude-success-light rounded-claude hover:bg-claude-success hover:text-white transition-colors"
                      >
                        Ôn tập
                      </button>
                      <button
                        onClick={() => navigate(`/test/${lesson.id}`, { state: { from: location.pathname } })}
                        className="px-3 py-1.5 text-xs font-medium text-center text-claude-warning bg-claude-warning-light rounded-claude hover:bg-claude-warning hover:text-white transition-colors"
                      >
                        Kiểm tra
                      </button>
                      <button
                        onClick={() => navigate(`/asteroid-match/${lesson.id}`, { state: { from: location.pathname } })}
                        className="px-3 py-1.5 text-xs font-medium text-center text-purple-600 bg-purple-50 rounded-claude hover:bg-purple-600 hover:text-white transition-colors"
                      >
                        Game
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
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
