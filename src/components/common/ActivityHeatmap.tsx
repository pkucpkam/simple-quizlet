import React, { useEffect, useState } from 'react';
import { historyService } from '../../service/historyService';
import { Link } from 'react-router-dom';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK_DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface HeatmapProps {
  userId: string;
}

const ActivityHeatmap: React.FC<HeatmapProps> = ({ userId }) => {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (userId) {
        const activityData = await historyService.getUserDailyActivity(userId);
        setData(activityData);
      }
      setLoading(false);
    };
    loadData();
  }, [userId]);

  // Generate date range (~52 weeks, ending today)
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 364);

  // Shift to start on a Sunday
  const startDay = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDay);

  const weeks: { date: Date; level: number }[][] = [];
  let currentWeek: { date: Date; level: number }[] = [];

  const curr = new Date(startDate);
  while (curr <= today || currentWeek.length > 0) {
    if (curr > today && currentWeek.length === 0) break;

    let level = 0;
    if (curr <= today) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const count = data[dateStr] || 0;

      if (count === 0) level = 0;
      else if (count <= 2) level = 1;
      else if (count <= 5) level = 2;
      else if (count <= 8) level = 3;
      else level = 4;
    }

    currentWeek.push({ date: new Date(curr), level });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    curr.setDate(curr.getDate() + 1);
  }

  const getColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-200';
      case 2: return 'bg-green-400';
      case 3: return 'bg-green-600';
      case 4: return 'bg-green-800';
      default: return 'bg-gray-100';
    }
  };

  const totalActivitiesThisYear = Object.entries(data).reduce((acc, [dateStr, count]) => {
    const dateObj = new Date(dateStr);
    if (dateObj >= startDate) {
      return acc + count;
    }
    return acc;
  }, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="h-24 bg-gray-100 rounded mb-4"></div>
        <div className="flex justify-end gap-2">
          <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
          <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">🔥</span> Hoạt động học tập
        </h2>
        <div className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          <span className="text-green-600 font-bold">{totalActivitiesThisYear}</span> hoạt động trong năm nay
        </div>
      </div>

      <div className="overflow-x-auto pb-6 pt-2 custom-scrollbar flex lg:justify-center">
        <div className="min-w-max pr-8">
          {/* Months header */}
          <div className="flex text-xs text-gray-400 mb-2 ml-[30px] relative h-4">
            {weeks.map((week, i) => {
              const currMonth = week[0].date.getMonth();
              const prevWeekMonth = i > 0 ? weeks[i - 1][0].date.getMonth() : -1;

              if (currMonth !== prevWeekMonth) {
                // Hide the first month label if it only has 1 or 2 weeks before the next month
                let shouldHide = false;
                if (i === 0) {
                  const futureMonth = weeks.length > 2 ? weeks[2][0].date.getMonth() : -1;
                  if (futureMonth !== currMonth) {
                    shouldHide = true;
                  }
                }

                if (!shouldHide) {
                  return (
                    <span key={i} className="absolute" style={{ left: `${i * 18}px` }}>
                      {MONTH_NAMES[currMonth]}
                    </span>
                  );
                }
              }
              return null;
            })}
          </div>

          <div className="flex">
            {/* Days sidebar */}
            <div className="flex flex-col gap-[4px] text-xs text-gray-400 mr-2 mt-[1px]">
              {WEEK_DAYS.map((day, i) => (
                <div key={i} className="h-[14px] leading-[14px] text-right pr-1">{day}</div>
              ))}
            </div>

            {/* Heatmap grid */}
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-[4px] mr-[4px]">
                {week.map((day, dIndex) => {
                  if (day.date > today) return <div key={dIndex} className="w-[14px] h-[14px] rounded-sm bg-transparent"></div>;

                  const dateStr = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
                  const count = data[dateStr] || 0;

                  return (
                    <div
                      key={dIndex}
                      className={`relative w-[14px] h-[14px] rounded-sm ${getColor(day.level)} hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 transition-colors cursor-pointer group`}
                    >
                      <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 z-10 shadow-lg font-medium">
                        {count === 0 ? "Chưa có" : `${count}`} hoạt động vào {dateStr}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-opactiy-100 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 border-t pt-4">
        <Link to="/study-history" className="text-blue-600 hover:text-blue-800 transition-colors font-medium mb-4 sm:mb-0">
          Xem chi tiết lịch sử học tập &rarr;
        </Link>
        <div className="flex items-center gap-2">
          <span>Học ít</span>
          <div className="flex gap-1">
            <div className="w-3.5 h-3.5 rounded-sm bg-gray-100"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-green-200"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-green-400"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-green-600"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-green-800"></div>
          </div>
          <span>Học nhiều</span>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default ActivityHeatmap;
