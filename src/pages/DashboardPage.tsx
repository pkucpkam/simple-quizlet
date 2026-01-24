import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { srsService } from "../service/srsService";
import toast from "react-hot-toast";

interface Stats {
    totalCards: number;
    newCards: number;
    learningCards: number;
    masteredCards: number;
    dueToday: number;
    totalReviews: number;
    accuracy: number;
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats>({
        totalCards: 0,
        newCards: 0,
        learningCards: 0,
        masteredCards: 0,
        dueToday: 0,
        totalReviews: 0,
        accuracy: 0,
    });
    const [loading, setLoading] = useState(true);

    const storedUser = sessionStorage.getItem("user");
    const username = storedUser ? JSON.parse(storedUser).username : null;

    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoading(true);
                const userStats = await srsService.getUserStats(username);
                setStats(userStats);
            } catch (error) {
                console.error("Error loading stats:", error);
                toast.error("Không thể tải thống kê");
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            loadStats();
        }
    }, [username]);

    const startReview = () => {
        if (stats.dueToday === 0) {
            toast.success("🎉 Bạn đã hoàn thành hết bài ôn hôm nay!");
            return;
        }
        navigate("/srs-review");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
                    <p className="text-gray-600">Theo dõi tiến độ học tập của bạn</p>
                </div>

                {/* Due Today Card - Prominent */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 mb-2">Cần ôn hôm nay</p>
                                <h2 className="text-6xl font-bold mb-4">{stats.dueToday}</h2>
                                <p className="text-blue-100">thẻ đang chờ bạn</p>
                            </div>
                            <button
                                onClick={startReview}
                                disabled={stats.dueToday === 0}
                                className={`px-8 py-4 rounded-xl font-semibold text-lg transition transform hover:scale-105 ${stats.dueToday > 0
                                    ? "bg-white text-blue-600 hover:bg-blue-50"
                                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                                    }`}
                            >
                                {stats.dueToday > 0 ? "Bắt đầu ôn tập" : "Đã hoàn thành"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Cards */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-4xl">📚</span>
                            <span className="text-3xl font-bold text-gray-800">{stats.totalCards}</span>
                        </div>
                        <h3 className="text-gray-600 font-semibold">Tổng số thẻ</h3>
                    </div>

                    {/* New Cards */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-4xl">🆕</span>
                            <span className="text-3xl font-bold text-blue-600">{stats.newCards}</span>
                        </div>
                        <h3 className="text-gray-600 font-semibold">Thẻ mới</h3>
                    </div>

                    {/* Learning */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-4xl">📖</span>
                            <span className="text-3xl font-bold text-orange-600">{stats.learningCards}</span>
                        </div>
                        <h3 className="text-gray-600 font-semibold">Đang học</h3>
                    </div>

                    {/* Mastered */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-4xl">🏆</span>
                            <span className="text-3xl font-bold text-green-600">{stats.masteredCards}</span>
                        </div>
                        <h3 className="text-gray-600 font-semibold">Đã thành thạo</h3>
                    </div>
                </div>

                {/* Progress Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Accuracy */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Độ chính xác</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div
                                        className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500"
                                        style={{ width: `${stats.accuracy}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-3xl font-bold text-green-600">{stats.accuracy}%</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Tổng {stats.totalReviews} lần ôn tập
                        </p>
                    </div>

                    {/* Card Distribution */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Phân bố thẻ</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Mới</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{
                                                width: `${stats.totalCards > 0 ? (stats.newCards / stats.totalCards) * 100 : 0}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                                        {stats.newCards}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Đang học</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-orange-600 h-2 rounded-full"
                                            style={{
                                                width: `${stats.totalCards > 0 ? (stats.learningCards / stats.totalCards) * 100 : 0
                                                    }%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                                        {stats.learningCards}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Thành thạo</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full"
                                            style={{
                                                width: `${stats.totalCards > 0 ? (stats.masteredCards / stats.totalCards) * 100 : 0
                                                    }%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                                        {stats.masteredCards}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Hành động nhanh</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => navigate("/my-lessons")}
                            className="px-6 py-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold"
                        >
                            📚 Bài học của tôi
                        </button>
                        <button
                            onClick={() => navigate("/create-lesson")}
                            className="px-6 py-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-semibold"
                        >
                            ➕ Tạo bài học mới
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="px-6 py-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-semibold"
                        >
                            🏠 Trang chủ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
