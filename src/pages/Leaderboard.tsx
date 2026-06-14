import React, { useEffect, useState } from 'react';
import { leaderboardService, type LeaderboardEntry } from '../service/leaderboardService';
import { auth } from '../service/firebase_setup';
import { Skeleton } from '../components/ui/Skeleton';

const Avatar: React.FC<{ photoURL?: string; username: string; className?: string }> = ({ photoURL, username, className = "" }) => {
  const finalUrl = photoURL || `https://i.pravatar.cc/150?u=${encodeURIComponent(username)}`;
  return (
    <img
      src={finalUrl}
      alt={username}
      className={`object-cover rounded-full bg-claude-surface-2 ${className}`}
      onError={(e) => {
        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
      }}
    />
  );
};

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const data = await leaderboardService.getLeaderboard();
      setEntries(data);
      const currentUid = auth.currentUser?.uid || JSON.parse(sessionStorage.getItem('user') || '{}').uid;
      if (currentUid) {
        const rank = data.findIndex(e => e.userId === currentUid) + 1;
        if (rank > 0) setCurrentUserRank(rank);
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  const formatTimeBig = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4 animate-fade-in">
        <Skeleton className="h-7 w-48 rounded mb-6" />
        <div className="flex justify-center gap-8 mb-10">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-48 rounded-claude-md" />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-claude-md" />)}
        </div>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const [rank1, rank2, rank3] = top3;

  const PodiumCard = ({
    entry, rank, height, highlight
  }: { entry: LeaderboardEntry; rank: number; height: string; highlight?: boolean }) => (
    <div className={`flex flex-col items-center ${highlight ? 'order-first md:order-none -mt-4 md:-mt-6' : ''}`}>
      <div className={`relative mb-3 ${highlight ? 'ring-2 ring-claude-accent ring-offset-2' : 'ring-2 ring-claude-border'} rounded-full bg-claude-surface`}>
        {highlight && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl">👑</div>}
        <Avatar photoURL={entry.photoURL} username={entry.username} className={highlight ? 'w-20 h-20' : 'w-16 h-16'} />
      </div>
      <p className={`font-semibold text-claude-text mb-2 text-center ${highlight ? 'text-sm' : 'text-xs'}`}>{entry.username}</p>
      <div className={`w-full bg-claude-surface border border-claude-border rounded-t-claude-md px-4 pb-6 pt-4 text-center flex flex-col items-center ${height}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm mb-3 ${
          rank === 1 ? 'bg-amber-400 text-amber-900' : rank === 2 ? 'bg-gray-200 text-gray-700' : 'bg-orange-100 text-orange-800'
        }`}>{rank}</div>
        <p className="text-[10px] text-claude-text-3 uppercase tracking-wider mb-1">Thời gian học</p>
        <p className={`font-bold text-claude-accent ${highlight ? 'text-xl' : 'text-lg'}`}>{formatTimeBig(entry.totalTimeSpent)}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-claude-text">Bảng Xếp Hạng</h1>
        <p className="text-sm text-claude-text-2 mt-1">Tôn vinh những học viên chăm chỉ nhất</p>
      </div>

      {entries.length === 0 ? (
        <div className="bg-claude-surface border border-claude-border rounded-claude-lg py-20 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-lg font-semibold text-claude-text">Chưa có ai lên bảng xếp hạng!</h2>
          <p className="text-sm text-claude-text-2 mt-2">Hãy là người đầu tiên học tập và ghi danh nhé!</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-4 md:gap-8 pt-8">
              {rank2 && <PodiumCard entry={rank2} rank={2} height="md:h-44" />}
              {rank1 && <PodiumCard entry={rank1} rank={1} height="md:h-56" highlight />}
              {rank3 && <PodiumCard entry={rank3} rank={3} height="md:h-36" />}
            </div>
          )}

          {/* Your rank banner */}
          {currentUserRank && (
            <div className="bg-claude-accent-lighter border border-amber-200 rounded-claude-md px-4 py-3 text-sm text-center text-claude-text">
              Bạn đang xếp hạng <strong className="text-claude-accent">#{currentUserRank}</strong> trong số {entries.length} học viên
            </div>
          )}

          {/* Rest table - Desktop */}
          {rest.length > 0 && (
            <div className="bg-claude-surface border border-claude-border rounded-claude-md shadow-claude-sm overflow-hidden hidden md:block">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-claude-border bg-claude-surface-2">
                <div className="col-span-1 text-xs font-semibold text-claude-text-2 uppercase tracking-wider text-center">Hạng</div>
                <div className="col-span-5 text-xs font-semibold text-claude-text-2 uppercase tracking-wider">Học viên</div>
                <div className="col-span-2 text-xs font-semibold text-claude-text-2 uppercase tracking-wider text-right">Thẻ</div>
                <div className="col-span-2 text-xs font-semibold text-claude-text-2 uppercase tracking-wider text-right">Ôn tập</div>
                <div className="col-span-2 text-xs font-semibold text-claude-text-2 uppercase tracking-wider text-right">Kiểm tra</div>
              </div>
              <div className="divide-y divide-claude-border">
                {rest.map((entry, index) => (
                  <div key={entry.userId} className="grid grid-cols-12 gap-4 px-5 py-3.5 claude-table-row items-center text-sm">
                    <div className="col-span-1 font-bold text-claude-text-3 text-center">{index + 4}</div>
                    <div className="col-span-5 flex items-center gap-3">
                      <Avatar photoURL={entry.photoURL} username={entry.username} className="w-9 h-9" />
                      <div>
                        <div className="font-medium text-claude-text text-sm">{entry.username}</div>
                        <div className="text-xs text-claude-accent">Total: {formatTimeBig(entry.totalTimeSpent)}</div>
                      </div>
                    </div>
                    <div className="col-span-2 text-right text-claude-text-2 text-sm">{formatTimeBig(entry.flashcardTime)}</div>
                    <div className="col-span-2 text-right text-claude-text-2 text-sm">{formatTimeBig(entry.reviewTime)}</div>
                    <div className="col-span-2 text-right">
                      <span className="px-2.5 py-1 bg-claude-surface-2 border border-claude-border rounded-claude text-xs font-medium text-claude-text-2">
                        {formatTimeBig(entry.testTime)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {rest.map((entry, index) => (
              <div key={entry.userId} className="bg-claude-surface border border-claude-border rounded-claude-md p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-bold text-claude-text-3 w-6 text-center">{index + 4}</span>
                  <Avatar photoURL={entry.photoURL} username={entry.username} className="w-9 h-9" />
                  <div className="flex-1">
                    <div className="font-medium text-claude-text text-sm">{entry.username}</div>
                    <div className="text-xs text-claude-accent">{formatTimeBig(entry.totalTimeSpent)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Thẻ', val: entry.flashcardTime },
                    { label: 'Ôn tập', val: entry.reviewTime },
                    { label: 'Kiểm tra', val: entry.testTime },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-claude-surface-2 rounded-claude p-2">
                      <p className="text-[10px] text-claude-text-3 mb-0.5">{label}</p>
                      <p className="text-xs font-semibold text-claude-text">{formatTimeBig(val)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
