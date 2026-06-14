import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { StudySession } from '../types/history';

interface StudyHistoryCardProps {
  session: StudySession;
}

const getModeConfig = (mode: string) => {
  switch (mode) {
    case 'flashcard': return { label: 'Thẻ ghi nhớ', emoji: '🃏', accent: 'bg-claude-info-light text-claude-info' };
    case 'quiz': return { label: 'Quiz', emoji: '❓', accent: 'bg-purple-50 text-purple-600' };
    case 'review': return { label: 'Ôn tập', emoji: '🧠', accent: 'bg-purple-50 text-purple-600' };
    case 'srs_review': return { label: 'SRS', emoji: '💡', accent: 'bg-claude-accent-light text-claude-accent' };
    case 'test': return { label: 'Kiểm tra', emoji: '📝', accent: 'bg-claude-success-light text-claude-success' };
    default: return { label: mode, emoji: '📖', accent: 'bg-claude-surface-2 text-claude-text-2' };
  }
};

const StudyHistoryCard: React.FC<StudyHistoryCardProps> = ({ session }) => {
  const navigate = useNavigate();
  const config = getModeConfig(session.studyMode);

  const formatDate = (date: Date): string =>
    new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) return `${minutes}p ${secs}s`;
    return `${secs}s`;
  };

  const accuracy = session.totalCount && session.totalCount > 0
    ? Math.round((session.knowCount * 100) / session.totalCount)
    : null;

  return (
    <div className="bg-claude-surface border border-claude-border rounded-claude-md p-4 hover:border-claude-accent hover:shadow-claude transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-medium text-claude-text line-clamp-2 group-hover:text-claude-accent transition-colors">
          {session.lessonTitle || session.setName || 'Bài học không tên'}
        </h3>
        <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${config.accent}`}>
          {config.emoji} {config.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-claude-surface-2 border border-claude-border rounded-claude p-2.5 text-center">
          <p className="text-lg font-bold text-claude-success">
            {session.knowCount}
            {session.totalCount && session.totalCount > 0 && (
              <span className="text-xs font-normal text-claude-text-3 ml-0.5">/{session.totalCount}</span>
            )}
          </p>
          <p className="text-[11px] text-claude-text-3">
            {accuracy !== null ? `Đúng (${accuracy}%)` : 'Từ đã thuộc'}
          </p>
        </div>
        <div className="bg-claude-surface-2 border border-claude-border rounded-claude p-2.5 text-center">
          <p className="text-lg font-bold text-claude-accent">{formatTime(session.timeSpent)}</p>
          <p className="text-[11px] text-claude-text-3">Thời gian</p>
        </div>
      </div>

      {/* Accuracy bar (if available) */}
      {accuracy !== null && (
        <div className="mb-3">
          <div className="w-full h-1.5 bg-claude-border rounded-full overflow-hidden">
            <div
              className="h-full bg-claude-success rounded-full transition-all"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-claude-border">
        <span className="text-[11px] text-claude-text-3">{formatDate(session.studyTime)}</span>
        {session.lessonId && (
          <button
            onClick={() => navigate(`/study/${session.lessonId}`, { state: { vocabId: session.setId, lessonId: session.lessonId, lessonTitle: session.lessonTitle } })}
            className="text-xs text-claude-accent hover:text-claude-accent-2 font-medium transition-colors"
          >
            Học lại →
          </button>
        )}
      </div>
    </div>
  );
};

export default StudyHistoryCard;
