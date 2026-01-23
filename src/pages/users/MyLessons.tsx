import { useState, useEffect } from "react";
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

interface Lesson {
  id: string;
  title: string;
  creator: string;
  vocabId: string;
  createdAt: Date;
  description: string;
  wordCount: number;
  isPrivate: boolean;
  folderId?: string | null;
}

type ViewMode = "all" | "folders" | "lessons";

export default function MyLessons() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  // Modals
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isSelectFolderOpen, setIsSelectFolderOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const storedUser = sessionStorage.getItem("user");
  const username = storedUser ? JSON.parse(storedUser).username : null;

  useEffect(() => {
    if (username) {
      fetchData();
    } else {
      setError("Vui lòng đăng nhập để xem bài học của bạn.");
      setLoading(false);
    }
  }, [username]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedLessons, fetchedFolders] = await Promise.all([
        lessonService.getMyLessons(username),
        folderService.getMyFolders(username),
      ]);
      setLessons(fetchedLessons);
      setFolders(fetchedFolders);
    } catch (err) {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (data: CreateFolderData) => {
    try {
      await folderService.createFolder(username, data);
      toast.success("Đã tạo thư mục mới!");
      fetchData(); // Reload data
    } catch (err) {
      toast.error("Không thể tạo thư mục.");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      // Check if folder has lessons
      const lessonsInFolder = lessons.filter((l) => l.folderId === folderId);
      if (lessonsInFolder.length > 0) {
        toast.error(`Không thể xóa thư mục có ${lessonsInFolder.length} bài học. Vui lòng di chuyển bài học ra trước.`);
        return;
      }

      await folderService.deleteFolder(folderId);
      setFolders(folders.filter((f) => f.id !== folderId));
      toast.success("Đã xóa thư mục!");
    } catch (err) {
      toast.error("Không thể xóa thư mục.");
    }
  };

  const handleDeleteLesson = async (id: string) => {
    try {
      await lessonService.deleteLessonById(id);
      setLessons(lessons.filter((l) => l.id !== id));
      toast.success("Đã xóa bài học!");
    } catch (err) {
      toast.error("Không thể xóa bài học.");
    }
  };

  const handleTogglePrivacy = async (id: string, isPrivate: boolean) => {
    try {
      await lessonService.togglePrivacyLesson(id, isPrivate);
      setLessons(lessons.map((l) => (l.id === id ? { ...l, isPrivate } : l)));
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái bài học.");
      throw err;
    }
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    if (!selectedLessonId) return;

    try {
      await lessonService.moveLessonToFolder(selectedLessonId, folderId);
      setLessons(
        lessons.map((l) => (l.id === selectedLessonId ? { ...l, folderId } : l))
      );
      toast.success(folderId ? "Đã thêm vào thư mục!" : "Đã xóa khỏi thư mục!");
      setSelectedLessonId(null);
    } catch (err) {
      toast.error("Không thể di chuyển bài học.");
    }
  };

  const openMoveToFolder = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setIsSelectFolderOpen(true);
  };

  // Filter lessons based on view mode
  const filteredLessons = lessons.filter((lesson) => {
    if (viewMode === "folders") return false; // Don't show lessons in folders view
    if (viewMode === "lessons") return !lesson.folderId; // Only show lessons without folder
    return true; // Show all in "all" mode
  });

  const lessonsWithoutFolder = lessons.filter((l) => !l.folderId);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Bài học của tôi</h1>
          <p className="text-gray-600 mt-1">
            {folders.length} thư mục • {lessons.length} bài học
          </p>
        </div>
        <button
          onClick={() => setIsCreateFolderOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <span>📁</span> Tạo thư mục mới
        </button>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setViewMode("all")}
          className={`px-4 py-2 font-medium transition ${viewMode === "all"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
            }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setViewMode("folders")}
          className={`px-4 py-2 font-medium transition ${viewMode === "folders"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
            }`}
        >
          Thư mục ({folders.length})
        </button>
        <button
          onClick={() => setViewMode("lessons")}
          className={`px-4 py-2 font-medium transition ${viewMode === "lessons"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
            }`}
        >
          Bài học riêng lẻ ({lessonsWithoutFolder.length})
        </button>
      </div>

      {loading && <p className="text-center text-gray-500">Đang tải...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="space-y-8">
          {/* Folders Section */}
          {(viewMode === "all" || viewMode === "folders") && folders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📁 Thư mục</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={(id) => navigate(`/folder/${id}`)}
                    onDelete={(id) => setFolderToDelete(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Lessons Section */}
          {(viewMode === "all" || viewMode === "lessons") && filteredLessons.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📚 {viewMode === "lessons" ? "Bài học riêng lẻ" : "Tất cả bài học"}
              </h2>
              <div className="flex flex-col gap-4">
                {filteredLessons.map((lesson) => (
                  <div key={lesson.id} className="relative">
                    <LessonCard
                      lesson={lesson}
                      onDelete={handleDeleteLesson}
                      onTogglePrivacy={handleTogglePrivacy}
                      onEdit={(id) => navigate(`/edit/${id}`)}
                    />
                    <button
                      onClick={() => openMoveToFolder(lesson.id)}
                      className="absolute top-4 right-16 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      title="Di chuyển vào thư mục"
                    >
                      📁 Thêm vào thư mục
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {folders.length === 0 && lessons.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500 mb-4">Bạn chưa có thư mục hoặc bài học nào</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setIsCreateFolderOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Tạo thư mục
                </button>
                <button
                  onClick={() => navigate("/create")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tạo bài học
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onSubmit={handleCreateFolder}
      />

      <SelectFolderModal
        isOpen={isSelectFolderOpen}
        onClose={() => {
          setIsSelectFolderOpen(false);
          setSelectedLessonId(null);
        }}
        onSelect={handleMoveToFolder}
        currentFolderId={
          selectedLessonId
            ? lessons.find((l) => l.id === selectedLessonId)?.folderId
            : null
        }
        username={username}
      />

      <ConfirmModal
        open={!!folderToDelete}
        title="Xác nhận xóa thư mục"
        message="Bạn có chắc chắn muốn xóa thư mục này không? Thư mục phải trống mới có thể xóa."
        onConfirm={() => {
          if (folderToDelete) {
            handleDeleteFolder(folderToDelete);
            setFolderToDelete(null);
          }
        }}
        onCancel={() => setFolderToDelete(null)}
      />
    </div>
  );
}
