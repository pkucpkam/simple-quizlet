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
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [officialFolders, setOfficialFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageCursors, setPageCursors] = useState<Map<number, QueryDocumentSnapshot<DocumentData> | null>>(
    new Map([[1, null]])
  );

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  // Hover & Menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const storedUser = sessionStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserId = parsedUser ? parsedUser.uid : null;
  const currentUsername = parsedUser ? parsedUser.username : null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      if (searchTerm !== debouncedTerm) {
        setCurrentPage(1);
      }
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
          const end = start + itemsPerPage;
          setLessons(results.slice(start, end) as Lesson[]);
        } else {
          const cursor = pageCursors.get(currentPage) || null;
          const result: PaginatedLessonsResult = await lessonService.getLessonsPaginated(
            itemsPerPage,
            cursor
          );
          setLessons(result.lessons as Lesson[]);
          setTotalItems(result.total);
          if (result.hasMore && result.lastVisible) {
            setPageCursors(prev => {
              const newMap = new Map(prev);
              newMap.set(currentPage + 1, result.lastVisible);
              return newMap;
            });
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Không thể tải bài học.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [debouncedTerm, currentPage, itemsPerPage, pageCursors]);

  // Handle click outside menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const confirmDelete = async () => {
    if (!lessonToDelete) return;
    try {
      await lessonService.deleteLessonById(lessonToDelete);
      setLessons(lessons.filter((l) => l.id !== lessonToDelete));
      toast.success("Đã xóa bài học!");
    } catch {
      toast.error("Lỗi khi xóa bài học.");
    } finally {
      setLessonToDelete(null);
    }
  };

  const toggleLessonPrivacy = async (lesson: Lesson) => {
    try {
      const newPrivacy = !lesson.isPrivate;
      await lessonService.togglePrivacyLesson(lesson.id, newPrivacy);
      setLessons(lessons.map(l => l.id === lesson.id ? { ...l, isPrivate: newPrivacy } : l));
      toast.success(newPrivacy ? "Đã đặt thành riêng tư" : "Đã công khai bài học");
      setActiveMenuId(null);
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const sortedLessons = useMemo(() => {
    const filtered = [...lessons];
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (sortField === "createdAt") {
        return sortOrder === "asc"
          ? new Date(aVal as Date).getTime() - new Date(bVal as Date).getTime()
          : new Date(bVal as Date).getTime() - new Date(aVal as Date).getTime();
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return filtered;
  }, [lessons, sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-400">⇅</span>;
    return sortOrder === "asc" ? <span>↑</span> : <span>↓</span>;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
    setPageCursors(new Map([[1, null]]));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Activity Heatmap */}
      {currentUserId && (
        <div className="mb-8">
          <ActivityHeatmap userId={currentUserId} />
        </div>
      )}

      {/* Official Folders Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Thư mục hệ thống</h2>
          <Link to="/admin" className="text-blue-600 text-sm hover:underline">Xem tất cả</Link>
        </div>

        {foldersLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {officialFolders.map((folder) => (
              <Link
                key={folder.id}
                to={`/folder/${folder.id}`}
                className="flex flex-col items-center bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{folder.icon}</span>
                <span className="font-bold text-gray-800 text-center text-sm truncate w-full">{folder.name}</span>
                <span className="text-xs text-gray-500 mt-1">{folder.lessonCount} bài học</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">Danh sách bài học</h1>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="w-full sm:w-96">
            <input
              type="text"
              placeholder="Tìm kiếm bài học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Hiển thị:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-600">/ trang</span>
          </div>
        </div>
      </div>

      {loading && !lessons.length && <p className="text-gray-500 text-center py-10">Đang tải...</p>}
      {error && <p className="text-red-500 text-center py-10">{error}</p>}

      {!loading && !error && lessons.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Chưa có bài học nào.</p>
          <button
            onClick={() => navigate("/create-lesson")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tạo bài học đầu tiên
          </button>
        </div>
      )}

      {(!loading || lessons.length > 0) && (
        <>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold cursor-pointer" onClick={() => handleSort("title")}>
                      <div className="flex items-center gap-2">Tên bài học <SortIcon field="title" /></div>
                    </th>
                    <th className="px-6 py-4 text-left font-semibold cursor-pointer hidden md:table-cell" onClick={() => handleSort("creator")}>
                      <div className="flex items-center gap-2">Người tạo <SortIcon field="creator" /></div>
                    </th>
                    <th className="px-6 py-4 text-center font-semibold cursor-pointer" onClick={() => handleSort("wordCount")}>
                      <div className="flex items-center justify-center gap-2">Số từ <SortIcon field="wordCount" /></div>
                    </th>
                    <th className="px-6 py-4 text-center font-semibold cursor-pointer hidden lg:table-cell" onClick={() => handleSort("createdAt")}>
                      <div className="flex items-center justify-center gap-2">Ngày tạo <SortIcon field="createdAt" /></div>
                    </th>
                    <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedLessons.map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-blue-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link to={`/lesson/${lesson.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                            {lesson.title}
                          </Link>
                          {lesson.isOfficial && (
                            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Official</span>
                          )}
                          {lesson.isPrivate && !lesson.isOfficial && (
                            <span className="text-[10px] text-gray-400 border border-gray-300 px-1.5 rounded uppercase">Riêng tư</span>
                          )}
                        </div>
                        {lesson.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{lesson.description}</p>}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-gray-600">{lesson.creator}</td>
                      <td className="px-6 py-4 text-center text-gray-600 font-medium">{lesson.wordCount}</td>
                      <td className="px-6 py-4 text-center hidden lg:table-cell text-gray-500">
                        {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={() => navigate(`/study/${lesson.id}`)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            Học ngay
                          </button>
                          <button
                            onClick={() => navigate(`/review/${lesson.id}`)}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            Ôn tập
                          </button>
                          <button
                            onClick={() => navigate(`/test/${lesson.id}`)}
                            className="px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                          >
                            Kiểm tra
                          </button>

                          {/* Owner Only Menu */}
                          {lesson.creator === currentUsername && (
                            <div className="relative ml-2" ref={activeMenuId === lesson.id ? menuRef : null}>
                              <button
                                onClick={() => setActiveMenuId(activeMenuId === lesson.id ? null : lesson.id)}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                              </button>

                              {activeMenuId === lesson.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                                  <button
                                    onClick={() => navigate(`/edit/${lesson.id}`)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-bold transition-colors"
                                  >
                                    Chỉnh sửa bài học
                                  </button>
                                  {!lesson.isOfficial && (
                                    <button
                                      onClick={() => toggleLessonPrivacy(lesson)}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-bold transition-colors"
                                    >
                                      {lesson.isPrivate ? "Chế độ công khai" : "Chế độ riêng tư"}
                                    </button>
                                  )}
                                  <div className="h-px bg-gray-100 my-1 mx-2"></div>
                                  <button
                                    onClick={() => {
                                      setLessonToDelete(lesson.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors"
                                  >
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
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Hiển thị {startItem}-{endItem} trong tổng số {totalItems} bài học
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}

      <ConfirmModal
        open={!!lessonToDelete}
        title="Xóa bài học"
        message="Bạn có chắc chắn muốn xóa bài học này? Hành động này không thể hoàn tác."
        onConfirm={confirmDelete}
        onCancel={() => setLessonToDelete(null)}
      />
    </div>
  );
}
