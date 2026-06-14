import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { lessonService, type PaginatedLessonsResult } from "../service/lessonService";
import { folderService } from "../service/folderService";
import toast from "react-hot-toast";
import ConfirmModal from "../components/common/ConfirmModal";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import ActivityHeatmap from "../components/common/ActivityHeatmap";
import Pagination from "../components/common/Pagination";
import type { Folder } from "../types/folder";
import ExerciseSelectionModal from "../components/review/ExerciseSelectionModal";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonTable } from "../components/ui/Skeleton";
import { useAuth } from "../hooks/useAuth";

interface Lesson {
  id: string;
  title: string;
  creator: string;
  vocabId: string;
  createdAt: Date;
  description: string;
  wordCount: number;
  isPrivate: boolean;
  isOfficial?: boolean;
}

type SortField = "title" | "creator" | "wordCount" | "createdAt";
type SortOrder = "asc" | "desc";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentUserId = user?.uid || null;
  const currentUsername = user?.username || null;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [officialFolders, setOfficialFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageCursors, setPageCursors] = useState<Map<number, QueryDocumentSnapshot<DocumentData> | null>>(
    new Map([[1, null]])
  );

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedLessonForReview, setSelectedLessonForReview] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      if (searchTerm !== debouncedTerm) setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedTerm]);

  useEffect(() => {
    const fetchFolders = async () => {
      setFoldersLoading(true);
      try {
        const folders = await folderService.getOfficialFolders();
        setOfficialFolders(folders);
      } catch (err) {
        console.error("Lỗi khi tải thư mục hệ thống:", err);
      } finally {
        setFoldersLoading(false);
      }
    };
    fetchFolders();
  }, []);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        if (debouncedTerm.trim()) {
          const results = await lessonService.searchLessons(debouncedTerm);
          setTotalItems(results.length);
          const start = (currentPage - 1) * itemsPerPage;
          setLessons(results.slice(start, start + itemsPerPage) as Lesson[]);
        } else {
          const cursor = pageCursors.get(currentPage) || null;
          const result: PaginatedLessonsResult = await lessonService.getLessonsPaginated(itemsPerPage, cursor, true);
          setLessons(result.lessons as Lesson[]);
          if (result.hasMore && result.lastVisible) {
            setPageCursors(prev => { const m = new Map(prev); m.set(currentPage + 1, result.lastVisible); return m; });
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Không thể tải bài học.");
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setActiveMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
  };

  const confirmDelete = async () => {
    if (!lessonToDelete) return;
    try {
      await lessonService.deleteLessonById(lessonToDelete);
      setLessons(lessons.filter((l) => l.id !== lessonToDelete));
      toast.success("Đã xóa bài học!");
    } catch { toast.error("Lỗi khi xóa bài học."); }
    finally { setLessonToDelete(null); }
  };

  const toggleLessonPrivacy = async (lesson: Lesson) => {
    try {
      const newPrivacy = !lesson.isPrivate;
      await lessonService.togglePrivacyLesson(lesson.id, newPrivacy);
      setLessons(lessons.map(l => l.id === lesson.id ? { ...l, isPrivate: newPrivacy } : l));
      toast.success(newPrivacy ? "Đã đặt thành riêng tư" : "Đã công khai bài học");
      setActiveMenuId(null);
    } catch { toast.error("Cập nhật thất bại"); }
  };

  const sortedLessons = useMemo(() => {
    const filtered = [...lessons];
    filtered.sort((a, b) => {
      const aVal = a[sortField], bVal = b[sortField];
      if (sortField === "createdAt") return sortOrder === "asc" ? new Date(aVal as Date).getTime() - new Date(bVal as Date).getTime() : new Date(bVal as Date).getTime() - new Date(aVal as Date).getTime();
      if (typeof aVal === "string" && typeof bVal === "string") return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (typeof aVal === "number" && typeof bVal === "number") return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      return 0;
    });
    return filtered;
  }, [lessons, sortField, sortOrder]);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-claude-text-3 text-xs">⇅</span>;
    return <span className="text-claude-accent text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-claude-text-2 uppercase tracking-wider cursor-pointer select-none hover:text-claude-text transition-colors";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Activity Heatmap */}
      {currentUserId && (
        <div className="bg-claude-surface border border-claude-border rounded-claude-md p-4 shadow-claude-sm">
          <ActivityHeatmap userId={currentUserId} />
        </div>
      )}

      {/* Official Folders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-claude-text">Thư mục hệ thống</h2>
          <Link to="/admin" className="text-xs font-medium text-claude-accent hover:text-claude-accent-2 transition-colors">
            Xem tất cả →
          </Link>
        </div>

        {foldersLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-24 bg-claude-surface border border-claude-border rounded-claude-md skeleton" />
            ))}
          </div>
        ) : officialFolders.length === 0 ? (
          <p className="text-sm text-claude-text-3 py-4">Chưa có thư mục hệ thống.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {officialFolders.map((folder) => (
              <Link
                key={folder.id}
                to={`/folder/${folder.id}`}
                className="flex flex-col items-center bg-claude-surface border border-claude-border rounded-claude-md p-4
                           hover:border-claude-accent hover:shadow-claude transition-all group"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{folder.icon}</span>
                <span className="text-xs font-medium text-claude-text text-center truncate w-full">{folder.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Lessons Section */}
      <section>
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-claude-text">Danh sách bài học</h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-claude-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm bài học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-claude-surface border border-claude-border rounded-claude text-claude-text placeholder:text-claude-text-3
                           focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent transition-colors"
              />
            </div>
            {/* Items per page */}
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); setPageCursors(new Map([[1, null]])); }}
              className="px-3 py-2 text-sm bg-claude-surface border border-claude-border rounded-claude text-claude-text
                         focus:outline-none focus:ring-2 focus:ring-claude-accent cursor-pointer"
            >
              {[5,10,20,50].map(n => <option key={n} value={n}>{n} / trang</option>)}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-claude-error-light border border-red-200 rounded-claude text-sm text-claude-error mb-4">{error}</div>
        )}

        {/* Table */}
        {!error && (
          <>
            {!loading && lessons.length === 0 ? (
              <div className="bg-claude-surface border border-claude-border rounded-claude-md">
                <EmptyState
                  title="Chưa có bài học nào"
                  description="Hãy tạo bài học đầu tiên của bạn để bắt đầu học."
                  action={{ label: "Tạo bài học", onClick: () => navigate("/create-lesson") }}
                />
              </div>
            ) : (
              <div className="bg-claude-surface border border-claude-border rounded-claude-md shadow-claude-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-claude-border bg-claude-surface-2">
                      <tr>
                        <th className={thClass} onClick={() => handleSort("title")}>
                          <div className="flex items-center gap-1.5">Tên bài học <SortIcon field="title" /></div>
                        </th>
                        <th className={`${thClass} hidden md:table-cell`} onClick={() => handleSort("creator")}>
                          <div className="flex items-center gap-1.5">Người tạo <SortIcon field="creator" /></div>
                        </th>
                        <th className={`${thClass} text-center`} onClick={() => handleSort("wordCount")}>
                          <div className="flex items-center justify-center gap-1.5">Số từ <SortIcon field="wordCount" /></div>
                        </th>
                        <th className={`${thClass} hidden lg:table-cell text-center`} onClick={() => handleSort("createdAt")}>
                          <div className="flex items-center justify-center gap-1.5">Ngày tạo <SortIcon field="createdAt" /></div>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-claude-text-2 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>

                    {loading ? (
                      <SkeletonTable rows={itemsPerPage > 10 ? 8 : 6} cols={5} />
                    ) : (
                      <tbody className="divide-y divide-claude-border">
                        {sortedLessons.map((lesson) => (
                          <tr key={lesson.id} className="claude-table-row group">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  to={`/lesson/${lesson.id}`}
                                  className="text-sm font-medium text-claude-text hover:text-claude-accent transition-colors"
                                >
                                  {lesson.title}
                                </Link>
                                {lesson.isOfficial && <Badge variant="official">Official</Badge>}
                                {lesson.isPrivate && !lesson.isOfficial && <Badge variant="private">Riêng tư</Badge>}
                              </div>
                              {lesson.description && (
                                <p className="text-xs text-claude-text-3 mt-0.5 line-clamp-1">{lesson.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-3.5 hidden md:table-cell text-sm text-claude-text-2">{lesson.creator}</td>
                            <td className="px-4 py-3.5 text-center text-sm font-medium text-claude-text-2">{lesson.wordCount}</td>
                            <td className="px-4 py-3.5 text-center hidden lg:table-cell text-xs text-claude-text-3">
                              {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex justify-end items-center gap-1">
                                <button
                                  onClick={() => navigate(`/study/${lesson.id}`)}
                                  className="px-2.5 py-1 text-xs font-medium rounded-claude bg-claude-accent-light text-claude-accent hover:bg-claude-accent hover:text-white transition-all"
                                >
                                  Học
                                </button>
                                <button
                                  onClick={() => setSelectedLessonForReview(lesson.id)}
                                  className="px-2.5 py-1 text-xs font-medium rounded-claude bg-claude-success-light text-claude-success hover:bg-claude-success hover:text-white transition-all"
                                >
                                  Ôn tập
                                </button>
                                <button
                                  onClick={() => navigate(`/test/${lesson.id}`)}
                                  className="px-2.5 py-1 text-xs font-medium rounded-claude bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white transition-all"
                                >
                                  Kiểm tra
                                </button>

                                {/* Owner menu */}
                                {lesson.creator === currentUsername && (
                                  <div className="relative ml-1" ref={activeMenuId === lesson.id ? menuRef : null}>
                                    <button
                                      onClick={() => setActiveMenuId(activeMenuId === lesson.id ? null : lesson.id)}
                                      className="p-1.5 text-claude-text-3 hover:bg-claude-sidebar-hover hover:text-claude-text rounded-claude transition-colors"
                                    >
                                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                      </svg>
                                    </button>
                                    {activeMenuId === lesson.id && (
                                      <div className="absolute right-0 mt-1 w-44 bg-claude-surface border border-claude-border rounded-claude-md shadow-claude-md z-20 py-1 animate-fade-in">
                                        <button onClick={() => navigate(`/edit/${lesson.id}`)}
                                          className="w-full text-left px-3 py-2 text-sm text-claude-text hover:bg-claude-surface-2 transition-colors">
                                          Chỉnh sửa
                                        </button>
                                        {!lesson.isOfficial && (
                                          <button onClick={() => toggleLessonPrivacy(lesson)}
                                            className="w-full text-left px-3 py-2 text-sm text-claude-text hover:bg-claude-surface-2 transition-colors">
                                            {lesson.isPrivate ? "Chuyển công khai" : "Chuyển riêng tư"}
                                          </button>
                                        )}
                                        <div className="h-px bg-claude-border mx-2 my-1" />
                                        <button onClick={() => { setLessonToDelete(lesson.id); setActiveMenuId(null); }}
                                          className="w-full text-left px-3 py-2 text-sm text-claude-error hover:bg-claude-error-light transition-colors">
                                          Xóa bài học
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    )}
                  </table>
                </div>

                {/* Pagination */}
                {!loading && lessons.length > 0 && (
                  <div className="px-4 py-3 border-t border-claude-border flex items-center justify-between">
                    <span className="text-xs text-claude-text-3">
                      {debouncedTerm ? `${totalItems} kết quả` : `Trang ${currentPage}`}
                    </span>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <ConfirmModal
        open={!!lessonToDelete}
        title="Xóa bài học"
        message="Bạn có chắc chắn muốn xóa bài học này? Hành động này không thể hoàn tác."
        onConfirm={confirmDelete}
        onCancel={() => setLessonToDelete(null)}
        confirmLabel="Xóa"
      />

      <ExerciseSelectionModal
        open={selectedLessonForReview !== null}
        onClose={() => setSelectedLessonForReview(null)}
        lessonId={selectedLessonForReview || ""}
      />
    </div>
  );
}
