import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { folderService } from "../service/folderService";
import type { Folder } from "../types/folder";
import type { Lesson } from "../service/lessonService";
import { toast } from "react-hot-toast";
import ExerciseSelectionModal from "../components/review/ExerciseSelectionModal";


const FolderView: React.FC = () => {
    const { folderId } = useParams<{ folderId: string }>();
    const navigate = useNavigate();
    const [folder, setFolder] = useState<Folder | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLessonForReview, setSelectedLessonForReview] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");


    useEffect(() => {
        const fetchFolderData = async () => {
            if (!folderId) return;
            try {
                setLoading(true);
                const folderData = await folderService.getFolder(folderId);
                if (!folderData) {
                    toast.error("Không tìm thấy thư mục");
                    navigate("/");
                    return;
                }
                setFolder(folderData);

                // Fetch lessons in this folder (Official lessons are usually public)
                // Use a general fetcher that works for anyone viewing public/official content
                const lessonsData = await folderService.getLessonsInFolder(folderId);
                setLessons(lessonsData);
            } catch (error) {
                console.error("Error fetching folder:", error);
                toast.error("Lỗi khi tải dữ liệu thư mục");
            } finally {
                setLoading(false);
            }
        };

        fetchFolderData();
    }, [folderId, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-6"></div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Đang mở tài liệu...</p>
            </div>
        );
    }

    if (!folder) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Hero Area */}
            <div className={`relative overflow-hidden ${folder.isOfficial ? 'bg-gradient-to-br from-indigo-700 to-purple-900' : 'bg-gradient-to-br from-blue-700 to-blue-900'} text-white py-16 px-4`}>
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Trang chủ
                        </button>

                        <button
                            onClick={() => navigate(`/create-lesson?folderId=${folderId}`)}
                            className="flex items-center gap-2 bg-white/20 backdrop-blur-md hover:bg-white/35 text-white font-bold px-4 py-2.5 rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/25 shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                            </svg>
                            Tạo bài học mới
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                        <div className="flex items-center justify-center w-28 h-28 bg-white/10 backdrop-blur-xl rounded-[2.5rem] text-6xl shadow-2xl border border-white/20 transition-transform hover:scale-105 duration-500">
                            {folder.icon}
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight">{folder.name}</h1>
                                {folder.isOfficial && (
                                    <span className="inline-block bg-white text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest self-center">
                                        Lộ trình Hệ thống
                                    </span>
                                )}
                            </div>
                            <p className="text-white/70 text-lg font-medium max-w-2xl leading-relaxed">
                                {folder.description || "Khám phá bộ sưu tập bài học được tuyển chọn để giúp bạn tiến xa hơn trên con đường chinh phục ngoại ngữ."}
                            </p>
                            <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-black text-white/40 uppercase tracking-[0.2em] pt-2">
                                <span className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    {lessons.length} Bài học
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Nội dung chính thức
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background Shapes */}
                <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Lessons Section */}
            <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
                <div className="flex justify-end mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex gap-1">
                        <button 
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:bg-gray-50"}`}
                            title="Chế độ lưới"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button 
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:bg-gray-50"}`}
                            title="Chế độ danh sách"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                    {lessons.map((lesson) => (
                        <div
                            key={lesson.id}
                            className={`group relative bg-white shadow-xl shadow-gray-200 border border-transparent hover:border-indigo-500 transition-all duration-500 hover:-translate-y-1 flex ${viewMode === "grid" ? "flex-col p-8 rounded-[2.5rem] h-full" : "flex-col md:flex-row p-6 pt-10 md:pt-6 rounded-3xl md:items-center gap-6"}`}
                        >
                            <div className="flex-1">
                                <div className={`flex ${viewMode === "grid" ? "justify-between" : "justify-start"} items-start mb-4`}>
                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                        {lesson.wordCount} Từ vựng
                                    </span>
                                    <div className={`text-xs font-bold text-gray-300 italic ${viewMode === "list" ? "absolute top-4 right-6 md:top-6" : ""}`}>
                                        {new Date(lesson.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition truncate mb-2">{lesson.title}</h3>
                                <p className={`text-gray-400 font-medium text-sm line-clamp-2 leading-relaxed ${viewMode === "grid" ? "mb-6" : "mb-2 md:mb-0"}`}>
                                    {lesson.description || "Bấm để bắt đầu lộ trình học tập hiệu quả với bộ thẻ ghi nhớ này."}
                                </p>
                            </div>

                            <div className={`grid gap-2 shrink-0 ${viewMode === "grid" ? "grid-cols-3 mt-4" : "grid-cols-2 sm:grid-cols-4 md:w-auto mt-4 md:mt-0"}`}>
                                <Link
                                    to={`/lesson/${lesson.id}`}
                                    className={`${viewMode === "grid" ? "col-span-3" : "col-span-2 sm:col-span-1 flex items-center justify-center px-4 min-h-[48px]"} bg-gray-50 hover:bg-indigo-50 text-indigo-600 font-black py-4 rounded-2xl text-center uppercase tracking-widest text-[9px] sm:text-[10px] transition-colors border-2 border-transparent hover:border-indigo-100`}
                                >
                                    Chi tiết
                                </Link>
                                <button
                                    onClick={() => navigate(`/study/${lesson.id}`)}
                                    className={`bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-2 rounded-2xl text-center uppercase tracking-widest text-[9px] sm:text-[10px] transition-all shadow-lg shadow-blue-100 active:scale-95 ${viewMode === "list" ? "flex items-center justify-center min-h-[48px]" : ""}`}
                                >
                                    Học
                                </button>
                                <button
                                    onClick={() => setSelectedLessonForReview(lesson.id)}
                                    className={`bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-2 rounded-2xl text-center uppercase tracking-widest text-[9px] sm:text-[10px] transition-all shadow-lg shadow-emerald-100 active:scale-95 ${viewMode === "list" ? "flex items-center justify-center min-h-[48px]" : ""}`}
                                >
                                    Ôn tập
                                </button>
                                <button
                                    onClick={() => navigate(`/test/${lesson.id}`)}
                                    className={`bg-purple-600 hover:bg-purple-700 text-white font-black py-3.5 px-2 rounded-2xl text-center uppercase tracking-widest text-[9px] sm:text-[10px] transition-all shadow-lg shadow-purple-100 active:scale-95 ${viewMode === "list" ? "flex items-center justify-center min-h-[48px]" : ""}`}
                                >
                                    Kiểm tra
                                </button>
                            </div>
                        </div>
                    ))}

                    {lessons.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-sm">
                            <div className="text-6xl mb-6 grayscale opacity-30">📚</div>
                            <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">Đang cập nhật bài học...</h3>
                            <p className="text-gray-300 font-bold mt-2">Vui lòng quay lại sau để trải nghiệm nội dung mới nhất.</p>
                        </div>
                    )}
                </div>

                {/* Footer Guide */}
                <div className="mt-16 text-center">
                    <p className="text-xs font-black text-gray-300 uppercase tracking-[0.3em] mb-1">Học không giới hạn</p>
                    <div className="h-1 w-20 bg-gray-100 mx-auto rounded-full"></div>
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
