import React, { useState, useEffect } from 'react';
import type { StudySession, StudyStats } from '../types/history';
import { historyService } from '../service/historyService';


const StudyHistory: React.FC = () => {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'flashcard' | 'quiz' | 'test'>('all');

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
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

  const filteredSessions = sessions.filter(session => 
    filter === 'all' || session.studyMode === filter
  );

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">Lịch sử học tập</h1>
        <p className="text-red-500 text-lg">
          Bạn cần <a href="/login" className="underline text-blue-600">đăng nhập</a> để xem lịch sử học tập.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch sử học tập</h1>
        <p className='text-red-600 mb-4'>* Chức năng này hiện tại chưa được phát triển.</p>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Tổng phiên học</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalSessions}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Thời gian học</h3>
              <p className="text-3xl font-bold text-green-600">{formatTime(stats.totalTimeSpent)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Điểm trung bình</h3>
              <p className="text-3xl font-bold text-yellow-600">%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bộ đã học</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.totalSetsStudied}</p>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'flashcard', label: 'Thẻ ghi nhớ' },
              { value: 'quiz', label: 'Quiz' },
              { value: 'test', label: 'Kiểm tra' }
            ].map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === filterOption.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Study Sessions */}
        {filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* {filteredSessions.map((session) => (
              <StudyHistoryCard key={session.id} session={session} />
            ))} */}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử học tập</h3>
            <p className="text-gray-500">Bắt đầu học để xem lịch sử tại đây!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyHistory;