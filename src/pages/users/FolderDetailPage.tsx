import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { folderService } from "../../service/folderService";
import { lessonService } from "../../service/lessonService";
import LessonCard from "../../components/LessonCard";
import type { Folder } from "../../types/folder";
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

export default function FolderDetailPage() {
    const { folderId } = useParams<{ folderId: string }>();
    const navigate = useNavigate();
    const [folder, setFolder] = useState<Folder | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const storedUser = sessionStorage.getItem("user");
    const currentUsername = storedUser ? JSON.parse(storedUser).username : null;

    useEffect(() => {
        if (!folderId || !currentUsername) {
            setError("Không tìm thấy thông tin thư mục.");
            setLoading(false);
            return;
        }

        loadFolderData();
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
        } catch (err) {
            toast.error("Không thể xóa bài học. Vui lòng thử lại.");
        }
    };

    const handleTogglePrivacy = async (id: string, isPrivate: boolean) => {
        try {
            await lessonService.togglePrivacyLesson(id, isPrivate);
            setLessons(lessons.map((l) => (l.id === id ? { ...l, isPrivate } : l)));
            toast.success("Đã cập nhật trạng thái bài học");
        } catch (err) {
            toast.error("Không thể cập nhật trạng thái bài học.");
            throw err;
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
        } catch (err) {
            toast.error("Không thể xóa bài học khỏi thư mục.");
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center">
                <p className="text-gray-500">Đang tải...</p>
            </div>
        );
    }

    if (error || !folder) {
        return (
            <div className="p-8 flex flex-col items-center gap-4">
                <p className="text-red-500">{error || "Không tìm thấy thư mục"}</p>
                <button
                    onClick={() => navigate("/my-lessons")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 flex flex-col gap-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/my-lessons")}
                    className="text-gray-600 hover:text-gray-800 text-2xl"
                >
                    ←
                </button>
                <div
                    className="flex-1 bg-white shadow-md rounded-xl p-6 border-l-4"
                    style={{ borderLeftColor: folder.color }}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-5xl">{folder.icon}</span>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-800">{folder.name}</h1>
                            {folder.description && (
                                <p className="text-gray-600 mt-2">{folder.description}</p>
                            )}
                            <p className="text-sm text-gray-400 mt-2">
                                {lessons.length} bài học
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lessons */}
            <div className="flex flex-col gap-6">
                {lessons.length === 0 ? (
                    <div className="bg-white shadow-md rounded-xl p-8 text-center">
                        <p className="text-gray-500">Chưa có bài học nào trong thư mục này</p>
                        <button
                            onClick={() => navigate("/create")}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Tạo bài học mới
                        </button>
                    </div>
                ) : (
                    lessons.map((lesson) => (
                        <div key={lesson.id} className="relative">
                            <LessonCard
                                lesson={lesson}
                                onDelete={handleDelete}
                                onTogglePrivacy={handleTogglePrivacy}
                                onEdit={(id) => navigate(`/edit/${id}`)}
                            />
                            <button
                                onClick={() => handleRemoveFromFolder(lesson.id)}
                                className="absolute top-4 right-16 px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition"
                                title="Xóa khỏi thư mục"
                            >
                                📤 Xóa khỏi thư mục
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
