import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { folderService } from "../../service/folderService";
import { lessonService } from "../../service/lessonService";
import LessonCard from "../../components/LessonCard";
import type { Folder } from "../../types/folder";
import toast from "react-hot-toast";
import Pagination from "../../components/common/Pagination";

import type { Lesson } from "../../types/lesson";

type SortOption = "date-desc" | "date-asc" | "name-asc" | "name-desc";

export default function FolderDetailPage() {
    const { folderId } = useParams<{ folderId: string }>();
    const navigate = useNavigate();
    const [folder, setFolder] = useState<Folder | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sortOption, setSortOption] = useState<SortOption>("date-desc");

    const storedUser = sessionStorage.getItem("user");
    const currentUsername = storedUser ? JSON.parse(storedUser).username : null;

    useEffect(() => {
        if (!folderId || !currentUsername) {
            setError("Không tìm thấy thông tin thư mục.");
            setLoading(false);
            return;
        }

        loadFolderData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [folderId, currentUsername]);

    const loadFolderData = async () => {
        try {
            setLoading(true);
            // Load folder info
            const folderData = await folderService.getFolder(folderId!);
            setFolder(folderData);

            // Load lessons in this folder
            const lessonsData = await lessonService.getMyLessons(currentUsername, folderId!);
            setLessons(lessonsData);

            // Update lesson count
            await folderService.updateLessonCount(folderId!, lessonsData.length);
        } catch (err) {
            console.error("Error loading folder:", err);
            setError("Không thể tải thông tin thư mục.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await lessonService.deleteLessonById(id);
            setLessons(lessons.filter((l) => l.id !== id));
            toast.success("Đã xóa bài học");

            // Update lesson count
            if (folder) {
                await folderService.updateLessonCount(folder.id, lessons.length - 1);
            }
        } catch {
            toast.error("Không thể xóa bài học. Vui lòng thử lại.");
        }
    };

    const handleTogglePrivacy = async (id: string, isPrivate: boolean) => {
        try {
            await lessonService.togglePrivacyLesson(id, isPrivate);
            setLessons(lessons.map((l) => (l.id === id ? { ...l, isPrivate } : l)));
            toast.success("Đã cập nhật trạng thái bài học");
        } catch {
            toast.error("Không thể cập nhật trạng thái bài học.");
            throw new Error("Update failed");
        }
    };

    const handleRemoveFromFolder = async (lessonId: string) => {
        try {
            await lessonService.moveLessonToFolder(lessonId, null);
            setLessons(lessons.filter((l) => l.id !== lessonId));
            toast.success("Đã xóa bài học khỏi thư mục");

            // Update lesson count
            if (folder) {
                await folderService.updateLessonCount(folder.id, lessons.length - 1);
            }
        } catch {
            toast.error("Không thể xóa bài học khỏi thư mục.");
        }
    };

    const sortedLessons = useMemo(() => {
        const sorted = [...lessons];
        switch (sortOption) {
            case "date-desc":
                return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            case "date-asc":
                return sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            case "name-asc":
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case "name-desc":
                return sorted.sort((a, b) => b.title.localeCompare(a.title));
            default:
                return sorted;
        }
    }, [lessons, sortOption]);

    // Pagination logic
    const [currentPage, setCurrentPage] = useState(1);
    const lessonsPerPage = 6;
    const totalPages = Math.ceil(sortedLessons.length / lessonsPerPage);
    const indexOfLastLesson = currentPage * lessonsPerPage;
    const indexOfFirstLesson = indexOfLastLesson - lessonsPerPage;
    const currentLessons = sortedLessons.slice(indexOfFirstLesson, indexOfLastLesson);

    // Reset to page 1 when sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [sortOption]);

    if (loading) {
        return (
            <div className="p-8 flex flex-col justify-center items-center py-40">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 font-medium">Đang tải thư mục...</p>
            </div>
        );
    }

    if (error || !folder) {
        return (
            <div className="p-8 flex flex-col items-center gap-6 py-20">
                <div className="text-6xl text-gray-300">📁</div>
                <p className="text-red-500 font-bold text-xl">{error || "Không tìm thấy thư mục"}</p>
                <button
                    onClick={() => navigate("/my-lessons")}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all font-semibold"
                >
                    Quay lại Bài học của tôi
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 flex flex-col gap-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center gap-6">
                <button
                    onClick={() => navigate("/my-lessons")}
                    className="p-3 bg-white shadow-sm border border-gray-100 text-gray-600 hover:text-blue-600 rounded-2xl hover:shadow-md transition-all"
                    title="Quay lại"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div
                    className="flex-1 w-full bg-white shadow-lg rounded-3xl p-6 border-l-8 md:p-8"
                    style={{ borderLeftColor: folder.color }}
                >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center justify-center w-20 h-20 bg-gray-50 rounded-2xl text-5xl shadow-inner">
                            {folder.icon}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-800">{folder.name}</h1>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100 uppercase tracking-wide">Thư mục</span>
                            </div>
                            {folder.description && (
                                <p className="text-gray-500 mt-3 text-lg">{folder.description}</p>
                            )}
                            <p className="text-sm text-gray-400 mt-4 font-medium flex items-center justify-center md:justify-start gap-1">
                                📚 {lessons.length} bài học • <span className="text-gray-300">Tạo bởi bạn</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                     <span className="text-gray-700 font-bold">{sortedLessons.length} bài học tìm thấy</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <label htmlFor="sort-select" className="text-gray-500 font-semibold text-sm">
                        Sắp xếp:
                    </label>
                    <div className="relative">
                        <select
                            id="sort-select"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border-none text-gray-700 text-sm font-bold rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer hover:bg-gray-100 transition-all"
                        >
                            <option value="date-desc">Mới nhất</option>
                            <option value="date-asc">Cũ nhất</option>
                            <option value="name-asc">Tên (A-Z)</option>
                            <option value="name-desc">Tên (Z-A)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4 4 4-4" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lessons Grid */}
            <div className="min-h-[400px]">
                {lessons.length === 0 ? (
                    <div className="bg-white shadow-md rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
                        <div className="text-6xl mb-6 opacity-30">📚</div>
                        <p className="text-gray-400 text-xl font-medium">Chưa có bài học nào trong thư mục này</p>
                        <button
                            onClick={() => navigate("/create")}
                            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all font-bold"
                        >
                            Tạo bài học đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentLessons.map((lesson) => (
                            <LessonCard
                                key={lesson.id}
                                lesson={lesson}
                                onDelete={handleDelete}
                                onTogglePrivacy={handleTogglePrivacy}
                                onEdit={(id) => navigate(`/edit/${id}`)}
                                onFolderAction={handleRemoveFromFolder}
                                folderActionLabel="Xóa khỏi thư mục"
                                folderActionIcon="📤"
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                activeColor="bg-blue-600"
            />
        </div>
    );
}
