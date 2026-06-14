import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LessonCard from "../../components/LessonCard";
import FolderCard from "../../components/FolderCard";
import CreateFolderModal from "../../components/modal/CreateFolderModal";
import SelectFolderModal from "../../components/modal/SelectFolderModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { lessonService } from "../../service/lessonService";
import { folderService } from "../../service/folderService";
import type { Folder, CreateFolderData } from "../../types/folder";
import toast from "react-hot-toast";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/ui/EmptyState";
import { SkeletonCard } from "../../components/ui/Skeleton";
import type { Lesson } from "../../types/lesson";
import { FolderPlus, Plus, BookOpen } from "lucide-react";

type ViewMode = "all" | "folders" | "lessons";

const viewModeOptions: { value: ViewMode; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "folders", label: "Thư mục" },
  { value: "lessons", label: "Bài học lẻ" },
];

export default function MyLessons() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isSelectFolderOpen, setIsSelectFolderOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const storedUser = sessionStorage.getItem("user");
  const username = storedUser ? JSON.parse(storedUser).username : null;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedLessons, fetchedFolders] = await Promise.all([
        lessonService.getMyLessons(username),
        folderService.getMyFolders(username),
      ]);
      const enrichedFolders = fetchedFolders.map(folder => ({
        ...folder,
        lessonCount: fetchedLessons.filter(l => l.folderId === folder.id).length,
      }));
      setLessons(fetchedLessons);
      setFolders(enrichedFolders);
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) fetchData();
    else { setError("Vui lòng đăng nhập để xem bài học của bạn."); setLoading(false); }
  }, [username, fetchData]);

  const handleCreateFolder = async (data: CreateFolderData) => {
    try { await folderService.createFolder(username, data); toast.success("Đã tạo thư mục mới!"); fetchData(); }
    catch { toast.error("Không thể tạo thư mục."); }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const lessonsInFolder = lessons.filter(l => l.folderId === folderId);
      if (lessonsInFolder.length > 0) { toast.error(`Không thể xóa thư mục có ${lessonsInFolder.length} bài học.`); return; }
      await folderService.deleteFolder(folderId);
      setFolders(folders.filter(f => f.id !== folderId));
      toast.success("Đã xóa thư mục!");
    } catch { toast.error("Không thể xóa thư mục."); }
  };

  const handleDeleteLesson = async (id: string) => {
    try { await lessonService.deleteLessonById(id); setLessons(lessons.filter(l => l.id !== id)); toast.success("Đã xóa bài học!"); }
    catch { toast.error("Không thể xóa bài học."); }
  };

  const handleTogglePrivacy = async (id: string, isPrivate: boolean) => {
    try { await lessonService.togglePrivacyLesson(id, isPrivate); setLessons(lessons.map(l => l.id === id ? { ...l, isPrivate } : l)); }
    catch { toast.error("Không thể cập nhật trạng thái bài học."); throw new Error("Update failed"); }
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    if (!selectedLessonId) return;
    try {
      await lessonService.moveLessonToFolder(selectedLessonId, folderId);
      setLessons(lessons.map(l => l.id === selectedLessonId ? { ...l, folderId } : l));
      toast.success(folderId ? "Đã thêm vào thư mục!" : "Đã xóa khỏi thư mục!");
      setSelectedLessonId(null);
    } catch { toast.error("Không thể di chuyển bài học."); }
  };

  const openMoveToFolder = (lessonId: string) => { setSelectedLessonId(lessonId); setIsSelectFolderOpen(true); };

  const filteredLessons = lessons.filter(lesson => {
    if (viewMode === "folders") return false;
    if (viewMode === "lessons") return !lesson.folderId;
    return true;
  });

  const lessonsWithoutFolder = lessons.filter(l => !l.folderId);
  const sortedLessons = [...filteredLessons].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [currentPage, setCurrentPage] = useState(1);
  const lessonsPerPage = 6;
  const totalPages = Math.ceil(sortedLessons.length / lessonsPerPage);
  const currentLessons = sortedLessons.slice((currentPage - 1) * lessonsPerPage, currentPage * lessonsPerPage);

  useEffect(() => { setCurrentPage(1); }, [viewMode, lessons.length]);

  const tabCounts: Record<ViewMode, number> = {
    all: lessons.length,
    folders: folders.length,
    lessons: lessonsWithoutFolder.length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-claude-text">Bài học của tôi</h1>
          <p className="text-sm text-claude-text-2 mt-0.5">
            {folders.length} thư mục · {lessons.length} bài học
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreateFolderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-claude-text-2 border border-claude-border rounded-claude bg-claude-surface hover:bg-claude-surface-2 transition-colors"
          >
            <FolderPlus className="h-4 w-4" strokeWidth={2} />
            Tạo thư mục
          </button>
          <button
            onClick={() => navigate("/create-lesson")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-claude-accent rounded-claude hover:bg-claude-accent-2 transition-colors shadow-claude-sm"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Tạo bài học
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-claude-error-light border border-red-200 rounded-claude text-sm text-claude-error flex items-center justify-between">
          {error}
          <button onClick={fetchData} className="text-claude-info hover:underline text-xs ml-4">Thử lại</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-claude-surface-2 border border-claude-border rounded-claude-md w-fit">
        {viewModeOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setViewMode(opt.value)}
            className={`px-3 py-1.5 rounded-claude border text-sm font-medium transition-all ${
              viewMode === opt.value
                ? 'bg-claude-surface border-claude-border text-claude-text shadow-claude-sm'
                : 'border-transparent text-claude-text-2 hover:text-claude-text'
            }`}
          >
            {opt.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              viewMode === opt.value ? 'bg-claude-accent-light text-claude-accent' : 'bg-claude-border text-claude-text-3'
            }`}>
              {tabCounts[opt.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : !error && (
        <div className="space-y-8">
          {/* Folders */}
          {(viewMode === "all" || viewMode === "folders") && folders.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-claude-text-2 uppercase tracking-wider">Thư mục</h2>
                {viewMode === "all" && (
                  <button onClick={() => setViewMode("folders")} className="text-xs text-claude-accent hover:text-claude-accent-2 transition-colors">
                    Xem tất cả →
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map(folder => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={id => navigate(`/folder/${id}`)}
                    onDelete={id => setFolderToDelete(id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Lessons */}
          {(viewMode === "all" || viewMode === "lessons") && (currentLessons.length > 0 || viewMode === "lessons") && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-claude-text-2 uppercase tracking-wider">
                  {viewMode === "all" ? "Bài học" : "Bài học riêng lẻ"}
                </h2>
                {viewMode === "all" && (
                  <button onClick={() => setViewMode("lessons")} className="text-xs text-claude-accent hover:text-claude-accent-2 transition-colors">
                    Xem tất cả →
                  </button>
                )}
              </div>
              {currentLessons.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentLessons.map(lesson => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        onDelete={handleDeleteLesson}
                        onTogglePrivacy={handleTogglePrivacy}
                        onEdit={id => navigate(`/edit/${id}`)}
                        onFolderAction={openMoveToFolder}
                        folderActionLabel="Thêm vào thư mục"
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                  )}
                </>
              ) : viewMode === "lessons" ? (
                <div className="bg-claude-surface border border-claude-border rounded-claude-md">
                  <EmptyState
                    title="Không có bài học riêng lẻ"
                    description="Tất cả bài học đã được thêm vào thư mục, hoặc bạn chưa tạo bài học nào."
                    action={{ label: "Tạo bài học mới", onClick: () => navigate("/create-lesson") }}
                  />
                </div>
              ) : null}
            </section>
          )}

          {/* Overall empty state */}
          {folders.length === 0 && lessons.length === 0 && (
            <div className="bg-claude-surface border border-claude-border rounded-claude-md">
              <EmptyState
                title="Chưa có thư mục hoặc bài học nào"
                description="Bắt đầu tạo nội dung học tập của bạn ngay hôm nay!"
                icon={<BookOpen className="h-10 w-10 text-claude-text-3" strokeWidth={1.2} />}
                action={{ label: "Tạo bài học đầu tiên", onClick: () => navigate("/create-lesson") }}
              />
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateFolderModal isOpen={isCreateFolderOpen} onClose={() => setIsCreateFolderOpen(false)} onSubmit={handleCreateFolder} />
      <SelectFolderModal
        isOpen={isSelectFolderOpen}
        onClose={() => { setIsSelectFolderOpen(false); setSelectedLessonId(null); }}
        onSelect={handleMoveToFolder}
        currentFolderId={selectedLessonId ? lessons.find(l => l.id === selectedLessonId)?.folderId : null}
        username={username}
      />
      <ConfirmModal
        open={!!folderToDelete}
        title="Xóa thư mục"
        message="Bạn có chắc chắn muốn xóa thư mục này? Thư mục phải trống mới có thể xóa."
        onConfirm={() => { if (folderToDelete) { handleDeleteFolder(folderToDelete); setFolderToDelete(null); } }}
        onCancel={() => setFolderToDelete(null)}
        confirmLabel="Xóa"
      />
    </div>
  );
}
