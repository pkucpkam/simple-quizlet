import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { StudySession } from '../types/history';

interface StudyHistoryCardProps {
    session: StudySession;
}

const StudyHistoryCard: React.FC<StudyHistoryCardProps> = ({ session }) => {
    const navigate = useNavigate();

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (minutes > 0) {
            return `${minutes} phút ${secs} giây`;
        }
        return `${secs} giây`;
    };

    const getModeLabel = (mode: string): string => {
        switch (mode) {
            case 'flashcard':
                return '📚 Thẻ ghi nhớ';
            case 'quiz':
                return '❓ Quiz';
            case 'test':
                return '📝 Kiểm tra';
            default:
                return mode;
        }
    };

    const getModeColor = (mode: string): string => {
        switch (mode) {
            case 'flashcard':
                return 'bg-blue-100 text-blue-800';
            case 'quiz':
                return 'bg-green-100 text-green-800';
            case 'test':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleStudyAgain = () => {
        if (session.lessonId) {
            navigate(`/study/${session.lessonId}`, {
                state: {
                    vocabId: session.setId,
                    lessonId: session.lessonId,
                    lessonTitle: session.lessonTitle,
                },
            });
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
                    {session.lessonTitle || session.setName || 'Bài học không tên'}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getModeColor(session.studyMode)}`}>
                    {getModeLabel(session.studyMode)}
                </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-md p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{session.knowCount}</p>
                    <p className="text-xs text-gray-500">Từ đã thuộc</p>
                </div>
                <div className="bg-gray-50 rounded-md p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{formatTime(session.timeSpent).split(' ')[0]}</p>
                    <p className="text-xs text-gray-500">Thời gian</p>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                    {formatDate(session.studyTime)}
                </span>
                <button
                    onClick={handleStudyAgain}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                    Học lại →
                </button>
            </div>
        </div>
    );
};

export default StudyHistoryCard;
