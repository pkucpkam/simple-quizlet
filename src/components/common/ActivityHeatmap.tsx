import React, { useEffect, useState } from 'react';
import { historyService } from '../../service/historyService';
import { Link } from 'react-router-dom';
import { Skeleton } from '../ui/Skeleton';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK_DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface HeatmapProps {
  userId: string;
}

// Claude amber-toned heatmap levels
const getColor = (level: number): string => {
  switch (level) {
    case 1: return 'bg-amber-100';
    case 2: return 'bg-amber-300';
    case 3: return 'bg-amber-500';
    case 4: return 'bg-amber-700';
    default: return 'bg-claude-border';
  }
};

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

  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 364);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: { date: Date; level: number }[][] = [];
  let currentWeek: { date: Date; level: number }[] = [];
  const curr = new Date(startDate);

  while (curr <= today || currentWeek.length > 0) {
    if (curr > today && currentWeek.length === 0) break;
    let level = 0;
    if (curr <= today) {
      const dateStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
      const count = data[dateStr] || 0;
      if (count === 0) level = 0;
      else if (count <= 2) level = 1;
      else if (count <= 5) level = 2;
      else if (count <= 8) level = 3;
      else level = 4;
    }
    currentWeek.push({ date: new Date(curr), level });
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    curr.setDate(curr.getDate() + 1);
  }

  const totalActivitiesThisYear = Object.entries(data).reduce((acc, [dateStr, count]) => {
    return new Date(dateStr) >= startDate ? acc + count : acc;
  }, 0);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44 rounded" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-20 w-full rounded" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-sm font-semibold text-claude-text flex items-center gap-2">
          🔥 Hoạt động học tập
        </h2>
        <div className="text-xs font-medium text-claude-text-2 bg-claude-surface-2 border border-claude-border px-2.5 py-1 rounded-full">
          <span className="text-claude-accent font-bold">{totalActivitiesThisYear}</span> hoạt động trong năm nay
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-2 flex lg:justify-center">
        <div className="min-w-max pr-4">
          {/* Month labels */}
          <div className="flex text-[10px] text-claude-text-3 mb-1 ml-[30px] relative h-3.5">
            {weeks.map((week, i) => {
              const currMonth = week[0].date.getMonth();
              const prevWeekMonth = i > 0 ? weeks[i - 1][0].date.getMonth() : -1;
              if (currMonth !== prevWeekMonth) {
                const shouldHide = i === 0 && weeks.length > 2 && weeks[2][0].date.getMonth() !== currMonth;
                if (!shouldHide) return (
                  <span key={i} className="absolute" style={{ left: `${i * 18}px` }}>
                    {MONTH_NAMES[currMonth]}
                  </span>
                );
              }
              return null;
            })}
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col gap-[4px] text-[10px] text-claude-text-3 mr-2 mt-[1px]">
              {WEEK_DAYS.map((day, i) => (
                <div key={i} className="h-[14px] leading-[14px] text-right pr-1">{day}</div>
              ))}
            </div>

            {/* Cells */}
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-[4px] mr-[4px]">
                {week.map((day, dIndex) => {
                  if (day.date > today) return <div key={dIndex} className="w-[14px] h-[14px] rounded-sm bg-transparent" />;
                  const dateStr = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
                  const count = data[dateStr] || 0;
                  return (
                    <div
                      key={dIndex}
                      className={`relative w-[14px] h-[14px] rounded-sm ${getColor(day.level)} hover:ring-2 hover:ring-offset-1 hover:ring-claude-accent transition-all cursor-pointer group`}
                    >
                      <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-claude-text text-white text-[10px] rounded px-2 py-1 whitespace-nowrap bottom-full left-1/2 -translate-x-1/2 -translate-y-1.5 z-10 shadow-claude-md">
                        {count === 0 ? "Chưa có" : `${count}`} hoạt động · {dateStr}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-claude-text" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-claude-text-3 border-t border-claude-border pt-3">
        <Link to="/study-history" className="text-claude-accent hover:text-claude-accent-2 transition-colors font-medium mb-2 sm:mb-0">
          Xem chi tiết lịch sử học tập →
        </Link>
        <div className="flex items-center gap-1.5">
          <span>Ít</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className={`w-3.5 h-3.5 rounded-sm ${getColor(level)}`} />
          ))}
          <span>Nhiều</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
