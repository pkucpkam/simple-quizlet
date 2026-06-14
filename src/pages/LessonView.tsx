import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lessonService, type VocabItem, type Lesson } from "../service/lessonService";
import { toast } from "react-hot-toast";
import ExerciseSelectionModal from "../components/review/ExerciseSelectionModal";
import Badge from "../components/ui/Badge";
import { SkeletonTable } from "../components/ui/Skeleton";

const BackIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const LessonView: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [words, setWords] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ email: string; username?: string } | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try { setCurrentUser(JSON.parse(storedUser)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lessonId) return;
      try {
        setLoading(true);
        const lessonData = await lessonService.getLesson(lessonId);
        if (!lessonData) { toast.error("Không tìm thấy bài học"); navigate("/"); return; }
        setLesson(lessonData);
        setWords(lessonData.vocabulary || []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Lỗi khi tải dữ liệu bài học");
      } finally {
        setLoading(false);
      }
    };
    fetchLessonData();
  }, [lessonId, navigate]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-fade-in space-y-4">
        <div className="h-6 w-32 skeleton rounded" />
        <div className="h-8 w-2/3 skeleton rounded" />
        <div className="h-4 w-1/2 skeleton rounded" />
        <div className="mt-6 bg-claude-surface border border-claude-border rounded-claude-md overflow-hidden">
          <table className="w-full">
            <SkeletonTable rows={8} cols={4} />
          </table>
        </div>
      </div>
    );
  }

  if (!lesson) return null;

  const isOwner = currentUser && (currentUser.username === lesson.creator || currentUser.email === lesson.creator);

  const ActionButton = ({
    onClick, label, variant = 'default'
  }: { onClick: () => void; label: string; variant?: 'default' | 'success' | 'warning' | 'gray' }) => {
    const styles = {
      default: 'bg-claude-accent text-white hover:bg-claude-accent-2 shadow-claude-sm',
      success: 'bg-claude-success text-white hover:bg-green-700 shadow-claude-sm',
      warning: 'bg-amber-600 text-white hover:bg-amber-700 shadow-claude-sm',
      gray: 'bg-claude-surface-2 text-claude-text border border-claude-border hover:bg-claude-border',
    };
    return (
      <button
        onClick={onClick}
        className={`flex-1 min-w-[140px] px-4 py-3 rounded-claude-md font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${styles[variant]}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Hero Header */}
      <div className={`relative overflow-hidden ${lesson.isOfficial ? 'bg-gradient-to-br from-stone-800 to-stone-900' : 'bg-gradient-to-br from-stone-700 to-stone-800'} text-white px-6 py-10`}>
        {/* Subtle abstract elements */}
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-64 h-64 bg-claude-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="mb-5 flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs font-medium"
          >
            <BackIcon />
            Quay lại
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                {lesson.isOfficial && <Badge variant="official">Chương trình hệ thống</Badge>}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">{lesson.title}</h1>
              <p className="text-white/60 text-sm leading-relaxed">
                {lesson.isOfficial
                  ? "Lộ trình học tập chính thức, được biên soạn chuyên nghiệp."
                  : (lesson.description || "Khám phá bộ từ vựng để nâng cao vốn tiếng Anh của bạn.")}
              </p>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span>Tạo bởi: {lesson.creator}</span>
                <span>·</span>
                <span>Cập nhật: {new Date(lesson.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Word count badge */}
            <div className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-claude-lg border border-white/10 text-center flex-shrink-0">
              <div className="text-3xl font-bold">{lesson.wordCount}</div>
              <div className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">Từ vựng</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 -mt-5 relative z-10">
        <div className="bg-claude-surface border border-claude-border rounded-claude-lg shadow-claude-md p-3 flex flex-wrap gap-2">
          <ActionButton onClick={() => navigate(`/study/${lesson.id}`)} label="🃏 Flashcards" variant="default" />
          <ActionButton onClick={() => setIsReviewModalOpen(true)} label="✍️ Ôn tập" variant="success" />
          <ActionButton onClick={() => navigate(`/test/${lesson.id}`)} label="📝 Kiểm tra" variant="warning" />
          {isOwner && (
            <ActionButton onClick={() => navigate(`/edit/${lesson.id}`)} label="✏️ Chỉnh sửa" variant="gray" />
          )}
        </div>
      </div>

      {/* Vocabulary Table */}
      <div className="px-6 mt-8">
        <h2 className="text-sm font-semibold text-claude-text-2 uppercase tracking-wider mb-3">
          Danh sách từ vựng
        </h2>
        <div className="bg-claude-surface border border-claude-border rounded-claude-md shadow-claude-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-claude-border bg-claude-surface-2">
                <tr>
                  {['Từ vựng', 'Phiên âm', 'Loại từ', 'Nghĩa', 'Ví dụ'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-claude-text-2 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-claude-border">
                {words.map((item, index) => (
                  <tr key={index} className="claude-table-row group">
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-claude-text group-hover:text-claude-accent transition-colors">{item.word}</span>
                    </td>
                    <td className="px-4 py-4">
                      {item.ipa
                        ? <span className="font-mono text-xs text-claude-info bg-claude-info-light px-2 py-0.5 rounded-claude">{`/${item.ipa}/`}</span>
                        : <span className="text-claude-text-3">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {item.wordType
                        ? <Badge variant="warning" size="sm">{item.wordType}</Badge>
                        : <span className="text-claude-text-3">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-claude-text-2">{item.definition}</span>
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      {item.exampleEn ? (
                        <div>
                          <p className="text-xs text-claude-text italic">"{item.exampleEn}"</p>
                          {item.exampleVi && <p className="text-xs text-claude-text-3 mt-0.5">{item.exampleVi}</p>}
                        </div>
                      ) : <span className="text-claude-text-3">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {words.length === 0 && (
            <div className="py-12 text-center text-sm text-claude-text-3">Không có dữ liệu từ vựng.</div>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-4 text-xs text-claude-text-3 text-center">
          Khóa học {lesson.isOfficial ? 'Chính thức' : 'Cộng đồng'} · {lesson.wordCount} từ vựng
        </p>
      </div>

      <ExerciseSelectionModal
        open={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        lessonId={lesson.id}
      />
    </div>
  );
};

export default LessonView;
