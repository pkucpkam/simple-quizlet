// import React from 'react';
// import type { StudySession } from '../../types/history';

// interface StudyHistoryCardProps {
//   session: StudySession;
// }

// const StudyHistoryCard: React.FC<StudyHistoryCardProps> = ({ session }) => {
//   const formatTime = (seconds: number): string => {
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
//   };

//   const getModeLabel = (mode: string): string => {
//     switch (mode) {
//       case 'flashcard': return 'Thẻ ghi nhớ';
//       case 'quiz': return 'Quiz';
//       case 'test': return 'Kiểm tra';
//       default: return mode;
//     }
//   };

//   const getDifficultyColor = (difficulty: string): string => {
//     switch (difficulty) {
//       case 'easy': return 'text-green-600 bg-green-100';
//       case 'medium': return 'text-yellow-600 bg-yellow-100';
//       case 'hard': return 'text-red-600 bg-red-100';
//       default: return 'text-gray-600 bg-gray-100';
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
//       <div className="flex justify-between items-start mb-3">
//         <h3 className="text-lg font-semibold text-gray-800 truncate">{session.setName}</h3>
//         <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(session.difficulty)}`}>
//           {session.difficulty}
//         </span>
//       </div>
      
//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div>
//           <p className="text-sm text-gray-600">Điểm số</p>
//           <p className="text-xl font-bold text-blue-600">{session.score}%</p>
//         </div>
//         <div>
//           <p className="text-sm text-gray-600">Thời gian</p>
//           <p className="text-xl font-bold text-green-600">{formatTime(session.timeSpent)}</p>
//         </div>
//       </div>

//       <div className="flex justify-between items-center mb-3">
//         <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
//           {getModeLabel(session.studyMode)}
//         </span>
//         <span className="text-sm text-gray-600">
//           {session.correctAnswers}/{session.totalQuestions} đúng
//         </span>
//       </div>

//       <p className="text-xs text-gray-500">
//         {new Date(session.completedAt).toLocaleString('vi-VN')}
//       </p>
//     </div>
//   );
// };

// export default StudyHistoryCard;