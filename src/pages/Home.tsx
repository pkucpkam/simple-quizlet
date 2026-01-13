import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { lessonService, type PaginatedLessonsResult } from "../service/lessonService";
import toast from "react-hot-toast";
import ConfirmModal from "../components/common/ConfirmModal";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

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

type SortField = "title" | "creator" | "wordCount" | "createdAt";
type SortOrder = "asc" | "desc";

export default function Home() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState(""); // Debounce state

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmPrivacy, setConfirmPrivacy] = useState<{ id: string; isPrivate: boolean } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCursors, setPageCursors] = useState<Map<number, QueryDocumentSnapshot<DocumentData> | null>>(
    new Map([[1, null]])
  );

  const navigate = useNavigate();

  const storedUser = sessionStorage.getItem("user");
  const currentUsername = storedUser ? JSON.parse(storedUser).username : null;

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      if (searchTerm !== debouncedTerm) {
        setCurrentPage(1); // Reset page only if term actually changed
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedTerm]);

  // Main Fetch Effect (Handles both Search and Pagination)
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);

        if (debouncedTerm.trim()) {
          // --- MODE 1: REAL SEARCH ---
          // Fetch all matches from server
          const results = await lessonService.searchLessons(debouncedTerm);
          setTotalItems(results.length);

          // Client-side paginate the search results
          const start = (currentPage - 1) * itemsPerPage;
          const end = start + itemsPerPage;
          setLessons(results.slice(start, end));

        } else {
          // --- MODE 2: OPTIMIZED CURSOR PAGINATION ---
          const cursor = pageCursors.get(currentPage) || null;
          const result: PaginatedLessonsResult = await lessonService.getLessonsPaginated(
            itemsPerPage,
            cursor
          );

          setLessons(result.lessons);
          setTotalItems(result.total);

          // Cache next page cursor
          if (result.hasMore && result.lastVisible) {
            setPageCursors(prev => {
              const newMap = new Map(prev);
              newMap.set(currentPage + 1, result.lastVisible);
              return newMap;
            });
          }
        }
      } catch (err) {
        setError("Không thể tải danh sách bài học. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, debouncedTerm]);

  const handleDelete = async (id: string) => {
    try {
      await lessonService.deleteLessonById(id);
      setLessons((prev) => prev.filter((l) => l.id !== id));
      setTotalItems((prev) => prev - 1);
      toast.success("Bài học đã được xóa thành công");
    } catch (error) {
      toast.error("Không thể xóa bài học. Vui lòng thử lại.");
    }
  };

  const handleTogglePrivacy = async (id: string, isPrivate: boolean) => {
    try {
      await lessonService.togglePrivacyLesson(id, isPrivate);
      setLessons((prev) =>
        prev.map((l) => (l.id === id ? { ...l, isPrivate } : l))
      );
      toast.success(`Bài học đã được chuyển sang ${isPrivate ? "riêng tư" : "công khai"}`);
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái bài học.");
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Client-side sorting (within current page / search results)
  const filteredAndSortedLessons = useMemo(() => {
    // Note: Filtering by searchTerm is redundant here if we use searchLessons (server-side),
    // BUT we keep it for immediate feedback or sorting logic.
    // Actually, we should just Sort here. Filtering is handled by fetchLessons.

    let filtered = [...lessons]; // Copy array

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "createdAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (typeof aValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [lessons, sortField, sortOrder]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-400">⇅</span>;
    return sortOrder === "asc" ? <span>↑</span> : <span>↓</span>;
  };

  // Pagination calculations
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
    setPageCursors(new Map([[1, null]])); // Reset cursors
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2; // Show 2 pages before and after current
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">Danh sách bài học</h1>

        {/* Search bar and items per page selector */}
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

      {loading && <p className="text-gray-500 text-center">Đang tải...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

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

      {/* Show table if loading (skeleton?) or if we have lessons */}
      {(!loading || lessons.length > 0) && (
        <>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                  <tr>
                    <th
                      className="px-6 py-4 text-left font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center gap-2">
                        Tên bài học <SortIcon field="title" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left font-semibold cursor-pointer hover:bg-blue-700 transition-colors hidden md:table-cell"
                      onClick={() => handleSort("creator")}
                    >
                      <div className="flex items-center gap-2">
                        Người tạo <SortIcon field="creator" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-center font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                      onClick={() => handleSort("wordCount")}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Số từ <SortIcon field="wordCount" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-center font-semibold cursor-pointer hover:bg-blue-700 transition-colors hidden lg:table-cell"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Ngày tạo <SortIcon field="createdAt" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">Trạng thái</th>
                    <th className="px-6 py-4 text-center font-semibold">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Handle Empty Search Result */}
                  {filteredAndSortedLessons.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Không tìm thấy bài học nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedLessons.map((lesson, index) => {
                      const isCreator = currentUsername === lesson.creator;
                      return (
                        <tr
                          key={lesson.id}
                          className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                        >
                          <td className="px-6 py-4">
                            <div
                              className="cursor-pointer"
                              onClick={() =>
                                navigate(`/study/${lesson.id}`, {
                                  state: { vocabId: lesson.vocabId },
                                })
                              }
                            >
                              <div className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                                {lesson.title}
                              </div>
                              <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                                {lesson.description}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700 hidden md:table-cell">
                            {lesson.creator}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {lesson.wordCount} từ
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600 text-sm hidden lg:table-cell">
                            {formatDate(lesson.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {lesson.isPrivate ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                🔒 Riêng tư
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                🌐 Công khai
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  navigate(`/study/${lesson.id}`, {
                                    state: {
                                      vocabId: lesson.vocabId,
                                      lessonId: lesson.id,
                                      lessonTitle: lesson.title
                                    },
                                  })
                                }
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                title="Học ngay"
                              >
                                📖 Học
                              </button>
                              {isCreator && (
                                <>
                                  <button
                                    onClick={() => setConfirmPrivacy({ id: lesson.id, isPrivate: !lesson.isPrivate })}
                                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                                    title={lesson.isPrivate ? "Chuyển công khai" : "Chuyển riêng tư"}
                                  >
                                    {lesson.isPrivate ? "🔓" : "🔒"}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(lesson.id)}
                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                    title="Xóa bài học"
                                  >
                                    🗑️
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Pagination info */}
                <p className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold">{startItem}</span> đến{' '}
                  <span className="font-semibold">{endItem}</span> trong tổng số{' '}
                  <span className="font-semibold">{totalItems}</span> bài học
                </p>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Trang trước"
                    >
                      ‹ Trước
                    </button>

                    {getPageNumbers().map((pageNum, index) => (
                      pageNum === '...' ? (
                        <span key={`dots-${index}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum as number)}
                          className={`px-3 py-1 rounded border transition-colors ${currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                          {pageNum}
                        </button>
                      )
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Trang sau"
                    >
                      Sau ›
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={confirmDelete !== null}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa bài học này không?`}
        onConfirm={async () => {
          if (confirmDelete) {
            await handleDelete(confirmDelete);
            setConfirmDelete(null);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Privacy Toggle Confirmation Modal */}
      <ConfirmModal
        open={confirmPrivacy !== null}
        title="Thay đổi quyền riêng tư"
        message={`Bạn có chắc chắn muốn ${confirmPrivacy?.isPrivate ? "chuyển sang riêng tư" : "chuyển sang công khai"} bài học này không?`}
        onConfirm={async () => {
          if (confirmPrivacy) {
            await handleTogglePrivacy(confirmPrivacy.id, confirmPrivacy.isPrivate);
            setConfirmPrivacy(null);
          }
        }}
        onCancel={() => setConfirmPrivacy(null)}
      />
    </div>
  );
}
