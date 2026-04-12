import React, { useEffect, useState } from 'react';
import { leaderboardService, type LeaderboardEntry } from '../service/leaderboardService';
import { auth } from '../service/firebase_setup';

const Avatar: React.FC<{ photoURL?: string, username: string, className?: string }> = ({ photoURL, username, className = "" }) => {
  const finalUrl = photoURL || `https://i.pravatar.cc/150?u=${encodeURIComponent(username)}`;
  return (
    <img 
      src={finalUrl} 
      alt={username} 
      className={`object-cover rounded-full bg-blue-50 ${className}`}
      onError={(e) => {
        // Dự phòng nếu Pravatar lỗi
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
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const rank1 = top3[0];
  const rank2 = top3[1];
  const rank3 = top3[2];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900 pt-4 pb-12 px-4 sm:px-6 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/40 rounded-[100%] blur-[100px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        <div className="text-center mb-5">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 mb-4">
            Bảng Xếp Hạng Học Tập
          </h1>
          <p className="text-lg text-blue-900/70 font-medium">Tôn vinh những cá nhân có thời gian học tập chăm chỉ nhất</p>
        </div>

        {entries.length > 0 ? (
          <>
            {/* Podium Area */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 mb-16 mt-10">
              
              {/* Rank 2 */}
              {rank2 && (
                <div className="flex flex-col items-center w-full md:w-64 order-2 md:order-1 mt-8 md:mt-0">
                  <div className="relative mb-4 ring-4 ring-white rounded-full shadow-lg bg-white">
                    <Avatar photoURL={rank2.photoURL} username={rank2.username} className="w-24 h-24" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">{rank2.username}</h3>
                  <div className="w-full bg-white border border-gray-200 border-b-0 rounded-t-2xl pt-6 pb-8 px-4 flex flex-col items-center shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:h-[220px]">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold mb-4 shadow-inner">2</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Thời gian học</div>
                    <div className="text-2xl font-bold text-blue-600 break-words text-center">{formatTimeBig(rank2.totalTimeSpent)}</div>
                  </div>
                </div>
              )}

              {/* Rank 1 */}
              {rank1 && (
                <div className="flex flex-col items-center w-full md:w-72 order-1 md:order-2 z-10">
                  <div className="relative mb-4 ring-8 ring-white rounded-full shadow-xl bg-white">
                    <div className="absolute -top-6 -right-6 text-4xl transform rotate-12 drop-shadow-md">👑</div>
                    <Avatar photoURL={rank1.photoURL} username={rank1.username} className="w-32 h-32" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-indigo-900">{rank1.username}</h3>
                  <div className="w-full bg-gradient-to-t from-yellow-50 to-white border border-yellow-200 border-b-0 rounded-t-2xl pt-8 pb-10 px-4 flex flex-col items-center shadow-[0_-15px_30px_rgba(250,204,21,0.15)] md:h-[280px]">
                    <div className="w-10 h-10 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center font-bold text-xl mb-4 shadow-md">1</div>
                    <div className="text-sm text-yellow-700 font-semibold uppercase tracking-wider mb-1">Thời gian học</div>
                    <div className="text-4xl font-extrabold text-indigo-700 break-words text-center drop-shadow-sm">{formatTimeBig(rank1.totalTimeSpent)}</div>
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {rank3 && (
                <div className="flex flex-col items-center w-full md:w-64 order-3 md:order-3 mt-8 md:mt-0">
                  <div className="relative mb-4 ring-4 ring-white rounded-full shadow-lg bg-white">
                    <Avatar photoURL={rank3.photoURL} username={rank3.username} className="w-24 h-24" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">{rank3.username}</h3>
                  <div className="w-full bg-white border border-gray-200 border-b-0 rounded-t-2xl pt-6 pb-8 px-4 flex flex-col items-center shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:h-[200px]">
                    <div className="w-8 h-8 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center font-bold mb-4 shadow-inner">3</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Thời gian học</div>
                    <div className="text-2xl font-bold text-blue-600 break-words text-center">{formatTimeBig(rank3.totalTimeSpent)}</div>
                  </div>
                </div>
              )}

            </div>

            {/* User Stats Banner */}
            {currentUserRank && (
              <div className="bg-white/80 backdrop-blur-md border border-blue-100 rounded-2xl p-4 mb-10 text-center shadow-sm">
                <span className="text-gray-700">Thời gian học cộng dồn của bạn hôm nay giúp bạn xếp hạng <strong className="text-blue-700">#{currentUserRank}</strong> - trong tổng {entries.length} học viên</span>
              </div>
            )}

            {/* Table List */}
            <div className="w-full overflow-x-auto rounded-2xl shadow-xl bg-white border border-gray-100 hidden md:block">
              <div className="min-w-[800px]">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-50/50 border-b border-gray-100">
                  <div className="col-span-1 text-center">Hạng</div>
                  <div className="col-span-5">Học viên</div>
                  <div className="col-span-2 text-right">Từ vựng (Thẻ)</div>
                  <div className="col-span-2 text-right">Ôn tập (SRS)</div>
                  <div className="col-span-2 text-right">Kiểm tra</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-gray-100">
                  {rest.map((entry, index) => (
                    <div 
                      key={entry.userId}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-blue-50/50 transition-colors items-center text-sm"
                    >
                      <div className="col-span-1 font-bold text-gray-400 text-lg text-center">
                        {index + 4}
                      </div>
                      <div className="col-span-5 flex items-center gap-3">
                        <Avatar photoURL={entry.photoURL} username={entry.username} className="w-10 h-10" />
                        <div>
                          <div className="font-semibold text-gray-900">{entry.username}</div>
                          <div className="text-xs text-indigo-600 font-medium">Tổng: {formatTimeBig(entry.totalTimeSpent)}</div>
                        </div>
                      </div>
                      <div className="col-span-2 text-right text-gray-600 font-medium">
                        {formatTimeBig(entry.flashcardTime)}
                      </div>
                      <div className="col-span-2 text-right text-gray-600 font-medium">
                        {formatTimeBig(entry.reviewTime)}
                      </div>
                      <div className="col-span-2 text-right font-medium flex items-center justify-end gap-2">
                        <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md">
                          {formatTimeBig(entry.testTime)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {rest.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50/30">
                      Chưa có thêm học viên nào nằm trong danh sách hạng kế tiếp.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile View for Table */}
            <div className="md:hidden space-y-3">
              {rest.map((entry, index) => (
                <div key={entry.userId} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50">
                    <div className="font-bold text-gray-400 w-6 text-center">{index + 4}</div>
                    <Avatar photoURL={entry.photoURL} username={entry.username} className="w-10 h-10" />
                    <div className="flex-1">
                       <div className="font-bold text-gray-900">{entry.username}</div>
                    </div>
                    <div className="font-bold text-indigo-600">
                       {formatTimeBig(entry.totalTimeSpent)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-gray-400 mb-1">Thẻ ghi nhớ</div>
                      <div className="font-semibold text-gray-700">{formatTimeBig(entry.flashcardTime)}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-gray-400 mb-1">Ôn tập</div>
                      <div className="font-semibold text-gray-700">{formatTimeBig(entry.reviewTime)}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-gray-400 mb-1">Kiểm tra</div>
                      <div className="font-semibold text-gray-700">{formatTimeBig(entry.testTime)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24 bg-white/80 rounded-3xl shadow-sm border border-white mt-8 backdrop-blur-sm">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800">Chưa có ai lên bảng xếp hạng!</h2>
            <p className="text-gray-500 mt-2">Hãy là người đầu tiên học tập và ghi danh nhé!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
