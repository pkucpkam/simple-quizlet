import React, { useState, useEffect } from 'react';
import type { StudyAggregateStats } from '../types/history';
import { historyService } from '../service/historyService';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Layers, Brain, FileText, Clock, Loader2, TrendingDown, TrendingUp, Play, BookOpen } from 'lucide-react';
import { lessonScoreService, type LessonScore } from '../service/lessonScoreService';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${seconds}s`;
};

const formatDate = (date?: Date): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  sessions: number;
  totalTime: number;
  lastStudied?: Date;
  accentClass: string;
  badgeClass: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  sessions,
  totalTime,
  lastStudied,
  accentClass,
  badgeClass,
}) => (
  <div className="bg-claude-surface border border-claude-border rounded-claude-md p-5 shadow-claude-sm hover:shadow-claude hover:border-claude-accent transition-all duration-300 group flex flex-col justify-between">
    <div>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-claude ${badgeClass} transition-transform duration-300 group-hover:scale-105`}>
          {icon}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
          {sessions} phiên
        </span>
      </div>

      <p className="text-xs font-semibold text-claude-text-2 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold ${accentClass} mb-1`}>{formatTime(totalTime)}</p>
    </div>
    <div className="text-xs text-claude-text-3 border-t border-claude-border mt-4 pt-3 flex items-center justify-between">
      <span>Lần cuối:</span>
      <span className="font-medium text-claude-text-2">{formatDate(lastStudied)}</span>
    </div>
  </div>
);

interface TotalCardProps {
  totalSessions: number;
  totalTime: number;
}

const TotalCard: React.FC<TotalCardProps> = ({ totalSessions, totalTime }) => (
  <div className="bg-claude-surface border border-claude-border rounded-claude-md p-6 shadow-claude-sm flex items-center justify-between relative overflow-hidden group hover:border-claude-accent transition-all duration-300">
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-claude-text-3">Tổng thời gian tích lũy</p>
      <p className="text-4xl font-extrabold text-claude-text tracking-tight">{formatTime(totalTime)}</p>
      <p className="text-sm text-claude-text-2 font-medium">
        Đã hoàn thành <span className="text-claude-accent font-semibold">{totalSessions}</span> phiên học tập
      </p>
    </div>
    <div className="p-4 bg-claude-accent-light rounded-claude-md text-claude-accent transition-transform duration-300 group-hover:scale-110">
      <Clock className="h-7 w-7" strokeWidth={2} />
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const StudyHistory: React.FC = () => {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [stats, setStats] = useState<StudyAggregateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [migrating, setMigrating] = useState(false);
  const [scores, setScores] = useState<LessonScore[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { setUser(null); }
    } else { setUser(null); }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      setLoading(true);

      // Chạy migration lần đầu nếu cần
      const existing = await historyService.getStudyAggregateStats(user.uid);
      if (!existing?.migrated) {
        setMigrating(true);
        await historyService.migrateUserHistory(user.uid);
        setMigrating(false);
      }

      const data = await historyService.getStudyAggregateStats(user.uid);
      setStats(data);
      setLoading(false);
    };
    init();

    const fetchScores = async () => {
      if (!user) return;
      try {
        setLoadingScores(true);
        const userScores = await lessonScoreService.getUserScores(user.uid);
        setScores(userScores);
      } catch (error) {
        console.error("Error fetching lesson scores:", error);
      } finally {
        setLoadingScores(false);
      }
    };
    fetchScores();
  }, [user]);

  if (!user) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-24">
        <p className="text-sm text-claude-text-2">
          Bạn cần <a href="/login" className="text-claude-accent hover:underline">đăng nhập</a> để xem lịch sử học tập.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-claude-text">Lịch sử học tập</h1>
        <p className="text-sm text-claude-text-2 mt-0.5">Thống kê tổng hợp quá trình học tập của bạn</p>
      </div>

      {/* Migration banner */}
      {migrating && (
        <div className="flex items-center gap-3 px-4 py-3 bg-claude-accent-lighter border border-claude-accent-light rounded-claude-md text-sm text-claude-accent">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>Đang chuyển đổi dữ liệu lịch sử cũ… Chỉ mất vài giây.</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-24 skeleton rounded-claude-md" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : stats ? (
        <>
          {/* Total card */}
          <TotalCard
            totalSessions={stats.totalSessions}
            totalTime={stats.totalTime}
          />

          {/* Per-mode cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={<Layers className="h-5 w-5 text-claude-accent" />}
              label="Thẻ ghi nhớ"
              sessions={stats.flashcard.sessions}
              totalTime={stats.flashcard.totalTime}
              lastStudied={stats.flashcard.lastStudied}
              accentClass="text-claude-accent"
              badgeClass="bg-claude-accent-light text-claude-accent"
            />
            <StatCard
              icon={<Brain className="h-5 w-5 text-claude-info" />}
              label="Ôn tập"
              sessions={stats.review.sessions}
              totalTime={stats.review.totalTime}
              lastStudied={stats.review.lastStudied}
              accentClass="text-claude-info"
              badgeClass="bg-claude-info-light text-claude-info"
            />
            <StatCard
              icon={<FileText className="h-5 w-5 text-claude-success" />}
              label="Kiểm tra"
              sessions={stats.test.sessions}
              totalTime={stats.test.totalTime}
              lastStudied={stats.test.lastStudied}
              accentClass="text-claude-success"
              badgeClass="bg-claude-success-light text-claude-success"
            />
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="bg-claude-surface border border-claude-border rounded-claude-md py-20 text-center">
          <Clock className="h-12 w-12 text-claude-text-3 mx-auto mb-4" strokeWidth={1.2} />
          <p className="text-sm font-medium text-claude-text">Chưa có lịch sử học tập</p>
          <p className="text-xs text-claude-text-3 mt-1">Bắt đầu học một bài học để thấy thống kê tại đây!</p>
        </div>
      )}

      {/* Lesson Scores Section */}
      <div className="mt-12 pt-8 border-t border-claude-border">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-claude-text">Cân Bằng Học Tập</h2>
          <p className="text-sm text-claude-text-2 mt-0.5">
            Các bài đã kiểm tra. Mỗi bài kiểm tra hoàn thành cộng 1 điểm, mỗi ngày trừ 1 điểm. Ưu tiên ôn tập bài điểm thấp.
          </p>
        </div>

        {loadingScores ? (
          <div className="h-40 skeleton rounded-claude-md" />
        ) : scores.length === 0 ? (
          <div className="bg-claude-surface border border-claude-border rounded-claude-md py-12 text-center">
            <BookOpen className="h-8 w-8 text-claude-text-3 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-claude-text">Chưa có bài kiểm tra nào</p>
            <p className="text-xs text-claude-text-3 mt-1">Hãy làm bài kiểm tra để hệ thống gợi ý cân bằng học tập.</p>
          </div>
        ) : (
          <div className="bg-claude-surface border border-claude-border rounded-claude-md shadow-claude-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-claude-surface-2 border-b border-claude-border">
                    <th className="py-3 px-4 font-semibold text-claude-text-2 text-xs uppercase tracking-wider">Bài Học</th>
                    <th className="py-3 px-4 font-semibold text-claude-text-2 text-xs uppercase tracking-wider text-center">Điểm Hiện Tại</th>
                    <th className="py-3 px-4 font-semibold text-claude-text-2 text-xs uppercase tracking-wider text-center">Cập Nhật Gần Nhất</th>
                    <th className="py-3 px-4 font-semibold text-claude-text-2 text-xs uppercase tracking-wider text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-claude-border">
                  {scores.map((score) => {
                    const effectivePoints = score.effectivePoints ?? 0;
                    const isLow = effectivePoints <= 0;
                    
                    return (
                      <tr key={score.lessonId} className="hover:bg-claude-surface-2/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-claude-text text-sm truncate max-w-[200px] md:max-w-[350px]">
                            {score.lessonTitle}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className={`inline-flex items-center justify-center font-bold px-2.5 py-0.5 rounded-full text-xs ${
                            isLow 
                              ? 'bg-claude-error-light text-claude-error border border-claude-error/20' 
                              : 'bg-claude-success-light text-claude-success border border-claude-success/20'
                          }`}>
                            {effectivePoints}
                            {isLow ? <TrendingDown className="w-3 h-3 ml-1" /> : <TrendingUp className="w-3 h-3 ml-1" />}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-claude-text-3">
                          {score.updatedAt.toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button 
                            onClick={() => navigate(`/test/${score.lessonId}`)}
                            variant={isLow ? "primary" : "secondary"}
                            className="py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
                          >
                            <Play className="w-3 h-3" />
                            Kiểm tra lại
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyHistory;