import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lessonService, type VocabItem, type Lesson } from "../service/lessonService";
import { toast } from "react-hot-toast";

const LessonView: React.FC = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [words, setWords] = useState<VocabItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ email: string; username?: string } | null>(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Error parsing user from session storage", e);
            }
        }
    }, []);

    useEffect(() => {
        const fetchLessonData = async () => {
            if (!lessonId) return;
            try {
                setLoading(true);
                const lessonData = await lessonService.getLesson(lessonId);
                if (!lessonData) {
                    toast.error("Không tìm thấy bài học");
                    navigate("/");
                    return;
                }
                setLesson(lessonData);
                setWords(lessonData.vocabulary || []);
            } catch (error) {
                console.error("Error fetching lesson:", error);
                const errorMessage = error instanceof Error ? error.message : "Lỗi khi tải dữ liệu bài học";
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchLessonData();
    }, [lessonId, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-6"></div>
                <p className="text-gray-400 font-bold text-sm">Đang chuẩn bị nội dung...</p>
            </div>
        );
    }

    if (!lesson) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Hero Area */}
            <div className={`relative overflow-hidden ${lesson.isOfficial ? 'bg-gradient-to-br from-blue-700 to-indigo-900' : 'bg-gradient-to-br from-gray-700 to-gray-900'} text-white py-16 px-4`}>
                <div className="max-w-4xl mx-auto relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors font-bold text-xs"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Quay lại
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-4 max-w-2xl">
                            {lesson.isOfficial && (
                                <span className="inline-block bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-900/40">
                                    Chương trình Hệ thống
                                </span>
                            )}
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">{lesson.title}</h1>
                            <p className="text-white/70 text-lg font-medium leading-relaxed">
                                {lesson.isOfficial
                                    ? "Lộ trình học tập chính thức, được biên soạn chuyên nghiệp và mở quyền truy cập miễn phí cho tất cả học viên."
                                    : (lesson.description || "Khám phá bộ từ vựng chuyên sâu để nâng cao vốn tiếng Anh của bạn.")}
                            </p>

                            <div className="flex items-center gap-4 text-sm font-bold text-white/50 pt-2">
                                <span className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Tạo bởi: {lesson.creator}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Cập nhật: {new Date(lesson.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center min-w-[140px]">
                            <div className="text-4xl font-black mb-1">{lesson.wordCount}</div>
                            <div className="text-[10px] font-bold text-white/50">Từ vựng</div>
                        </div>
                    </div>
                </div>

                {/* Abstract SVG Background Elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Content Area */}
            <div className="max-w-4xl mx-auto -mt-10 px-4 relative z-20">
                {/* Action Bar */}
                <div className="bg-white p-4 rounded-[2rem] shadow-xl shadow-gray-200 border border-gray-100 flex flex-wrap justify-center gap-4 mb-12">
                    <button
                        onClick={() => navigate(`/study/${lesson.id}`)}
                        className="flex-1 min-w-[180px] bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Flashcards
                    </button>
                    <button
                        onClick={() => navigate(`/review/${lesson.id}`)}
                        className="flex-1 min-w-[180px] bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                        Ôn tập
                    </button>
                     <button
                        onClick={() => navigate(`/test/${lesson.id}`)}
                        className="flex-1 min-w-[180px] bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-amber-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        Kiểm tra
                    </button>

                    {/* Edit Button for Owner */}
                    {currentUser && (currentUser.username === lesson.creator || currentUser.email === lesson.creator) && (
                        <button
                            onClick={() => navigate(`/edit/${lesson.id}`)}
                            className="flex-1 min-w-[180px] bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-gray-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Chỉnh sửa
                        </button>
                    )}
                </div>

                {/* Word List Table */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 mb-6 flex items-center gap-2 ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                        Danh sách từ vựng lộ trình
                    </h3>

                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400">Từ vựng</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400">Phiên âm</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400">Loại từ</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400">Nghĩa</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400">Ví dụ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {words.map((item, index) => (
                                    <tr key={index} className="group hover:bg-blue-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <span className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors tracking-tight">{item.word}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{item.ipa ? `/${item.ipa}/` : '—'}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            {item.wordType ? (
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{item.wordType}</span>
                                            ) : (
                                                <span className="text-gray-300">&mdash;</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-bold text-gray-600 leading-relaxed">{item.definition}</span>
                                        </td>
                                        <td className="px-8 py-6 max-w-xs">
                                            {item.exampleEn ? (
                                                <div>
                                                    <p className="text-sm text-gray-700 italic">"{item.exampleEn}"</p>
                                                    {item.exampleVi && <p className="text-xs text-gray-400 mt-1">{item.exampleVi}</p>}
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">&mdash;</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {words.length === 0 && (
                            <div className="p-20 text-center">
                                <p className="text-gray-400 font-bold italic">Không có dữ liệu từ vựng.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Footer Info */}
                <div className="mt-12 p-8 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                    <p className="text-sm font-bold text-blue-800/60 leading-loose">
                        Khóa học này là một phần của thư viện học tập {lesson.isOfficial ? 'Chính thức' : 'Cộng đồng'}.<br />
                        Hãy bắt đầu học ngay để cải thiện kỹ năng ngôn ngữ của bạn!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LessonView;
