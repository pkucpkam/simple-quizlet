import React, { useState, useEffect } from 'react';
import type { StudySession, StudyStats } from '../types/history';
import { historyService } from '../service/historyService';
import StudyHistoryCard from '../components/StudyHistoryCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { Layers, Brain, FileText, Clock } from 'lucide-react';

type FilterMode = 'all' | 'flashcard' | 'review' | 'test';

const filterOptions: { value: FilterMode; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'flashcard', label: 'Thẻ ghi nhớ' },
  { value: 'review', label: 'Ôn tập' },
  { value: 'test', label: 'Kiểm tra' },
];

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  time: string;
  sessions: number;
  accent: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, time, sessions, accent }) => (
  <div className={`bg-claude-surface border border-claude-border rounded-claude-md p-5 shadow-claude-sm hover:shadow-claude transition-shadow`}>
    <div className="flex items-start justify-between mb-3">
      <div className="text-claude-text-2">{icon}</div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accent}`}>
        {sessions} phiên
      </span>
    </div>
    <p className="text-xs font-medium text-claude-text-2 mb-1">{label}</p>
    <p className="text-2xl font-bold text-claude-text">{time}</p>
  </div>
);

const StudyHistory: React.FC = () => {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { setUser(null); }
    } else { setUser(null); }
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setLoading(true);
      const history = await historyService.getUserStudyHistory(user.uid);
      setSessions(history);
      setStats(historyService.getStudyStats(history));
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  useEffect(() => { setCurrentPage(1); }, [filter]);

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'flashcard') return session.studyMode === 'flashcard';
    if (filter === 'test') return session.studyMode === 'test';
    if (filter === 'review') return ['quiz', 'review', 'srs_review'].includes(session.studyMode);
    return false;
  });

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const currentSessions = filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
    <div className="p-6 max-w-6xl mx-auto animate-fade-in space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-claude-text">Lịch sử học tập</h1>
        <p className="text-sm text-claude-text-2 mt-0.5">Theo dõi tiến độ và thống kê học tập của bạn</p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            icon={<Layers className="h-5 w-5 text-claude-info" />}
            label="Thẻ ghi nhớ"
            time={formatTime(stats.flashcardStats?.timeSpent || 0)}
            sessions={stats.flashcardStats?.sessions || 0}
            accent="bg-claude-info-light text-claude-info"
          />
          <MetricCard
            icon={<Brain className="h-5 w-5 text-purple-600" />}
            label="Ôn tập (Review/SRS)"
            time={formatTime(stats.reviewStats?.timeSpent || 0)}
            sessions={stats.reviewStats?.sessions || 0}
            accent="bg-purple-50 text-purple-600"
          />
          <MetricCard
            icon={<FileText className="h-5 w-5 text-claude-success" />}
            label="Kiểm tra (Test)"
            time={formatTime(stats.testStats?.timeSpent || 0)}
            sessions={stats.testStats?.sessions || 0}
            accent="bg-claude-success-light text-claude-success"
          />
        </div>
      ) : null}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-claude-surface-2 border border-claude-border rounded-claude-md w-fit">
        {filterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-claude text-sm font-medium transition-all ${
              filter === opt.value
                ? 'bg-claude-surface border border-claude-border text-claude-text shadow-claude-sm'
                : 'text-claude-text-2 hover:text-claude-text'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Session Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : currentSessions.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSessions.map((session) => (
              <StudyHistoryCard key={session.id} session={session} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 text-xs font-medium text-claude-text-2 border border-claude-border rounded-claude bg-claude-surface hover:bg-claude-surface-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ←
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-claude text-xs font-medium transition-colors ${
                    currentPage === i + 1
                      ? 'bg-claude-accent text-white border border-claude-accent'
                      : 'bg-claude-surface text-claude-text-2 border border-claude-border hover:bg-claude-surface-2'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 text-xs font-medium text-claude-text-2 border border-claude-border rounded-claude bg-claude-surface hover:bg-claude-surface-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-claude-surface border border-claude-border rounded-claude-md">
          <EmptyState
            title="Chưa có lịch sử học tập"
            description="Bắt đầu học một bài học để thấy lịch sử tại đây!"
            icon={<Clock className="h-10 w-10 text-claude-text-3" strokeWidth={1.2} />}
          />
        </div>
      )}
    </div>
  );
};

export default StudyHistory;