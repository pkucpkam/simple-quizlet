import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { lessonService, type VocabItem, type Lesson } from "../service/lessonService";
import { toast } from "react-hot-toast";
import ExerciseSelectionModal from "../components/review/ExerciseSelectionModal";
import Badge from "../components/ui/Badge";
import { SkeletonTable } from "../components/ui/Skeleton";
import { ArrowLeft, Layers, BookOpen, FileText, Pencil, Gamepad2 } from "lucide-react";

const BackIcon = () => <ArrowLeft className="h-4 w-4" strokeWidth={2} />;

const LessonView: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
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
      <div className="w-full animate-fade-in">
        {/* Skeleton Banner */}
        <div className="w-full bg-stone-900/5 py-8 border-b border-claude-border">
          <div className="max-w-4xl mx-auto px-6">
            <div className="h-4 w-20 skeleton rounded mb-5" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
              <div className="flex items-center gap-5 flex-1 w-full">
                <div className="w-16 h-16 skeleton rounded-claude-lg flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-1/3 skeleton rounded" />
                  <div className="h-4 w-2/3 skeleton rounded" />
                  <div className="h-3 w-1/4 skeleton rounded" />
                </div>
              </div>
              <div className="w-20 h-16 skeleton rounded-claude-lg flex-shrink-0 self-start md:self-auto" />
            </div>
          </div>
        </div>

        {/* Skeleton Content */}
        <div className="max-w-4xl mx-auto px-6 mt-8">
          <div className="h-14 w-full skeleton rounded-claude-lg mb-6" />
          <div className="h-5 w-40 skeleton rounded mb-3" />
          <div className="bg-claude-surface border border-claude-border rounded-claude-md overflow-hidden">
            <table className="w-full">
              <SkeletonTable rows={8} cols={4} />
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) return null;

  const isOwner = currentUser && (currentUser.username === lesson.creator || currentUser.email === lesson.creator);

  const ActionButton = ({
    onClick, label, icon, variant = 'default'
  }: { onClick: () => void; label: string; icon?: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'gray' | 'info' }) => {
    const styles = {
      default: 'bg-claude-accent text-white hover:bg-claude-accent-2 shadow-claude-sm',
      success: 'bg-claude-success text-white hover:bg-green-700 shadow-claude-sm',
      warning: 'bg-amber-600 text-white hover:bg-amber-700 shadow-claude-sm',
      gray: 'bg-claude-surface-2 text-claude-text border border-claude-border hover:bg-claude-border',
      info: 'bg-blue-600 text-white hover:bg-blue-700 shadow-claude-sm',
    };
    return (
      <button
        onClick={onClick}
        className={`flex-1 min-w-[140px] px-4 py-3 rounded-claude-md font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${styles[variant]}`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="w-full pb-12 animate-fade-in">
      {/* Header Banner - Full Width */}
      <div className={`w-full bg-gradient-to-br ${lesson.isOfficial ? 'from-stone-800 to-stone-900' : 'from-stone-700 to-stone-800'} text-white py-8 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-48 h-48 bg-claude-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="mb-5 flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs font-medium"
          >
            <BackIcon />
            Quay lại
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="flex items-center gap-5">
              <div
                className="flex items-center justify-center w-16 h-16 backdrop-blur-sm rounded-claude-lg flex-shrink-0 border border-white/10"
                style={{ backgroundColor: 'rgba(217, 119, 6, 0.2)' }}
              >
                <BookOpen className="h-8 w-8 text-claude-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-white">{lesson.title}</h1>
                  {lesson.isOfficial && <Badge variant="official" size="sm">Official</Badge>}
                </div>
                <p className="text-sm text-white/60">
                  {lesson.isOfficial
                    ? "Lộ trình học tập chính thức, được biên soạn chuyên nghiệp."
                    : (lesson.description || "Khám phá bộ từ vựng để nâng cao vốn tiếng Anh của bạn.")}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  Tạo bởi: {lesson.creator} · Cập nhật: {new Date(lesson.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            {/* Word count badge - Large size, on the right */}
            <div className="bg-white/10 backdrop-blur-sm px-6 py-3.5 rounded-claude-lg border border-white/10 text-center flex-shrink-0 self-start md:self-auto">
              <div className="text-2xl font-bold text-white">{lesson.wordCount}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mt-0.5">Từ vựng</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="max-w-4xl mx-auto px-6 -mt-5 relative z-10">
        <div className="bg-claude-surface border border-claude-border rounded-claude-lg shadow-claude-md p-3 flex flex-wrap gap-2">
          <ActionButton onClick={() => navigate(`/study/${lesson.id}`, { state: { from: location.pathname } })} label="Flashcards" icon={<Layers className="h-4 w-4" />} variant="info" />
          <ActionButton onClick={() => setIsReviewModalOpen(true)} label="Ôn tập" icon={<BookOpen className="h-4 w-4" />} variant="success" />
          <ActionButton onClick={() => navigate(`/test/${lesson.id}`, { state: { from: location.pathname } })} label="Kiểm tra" icon={<FileText className="h-4 w-4" />} variant="warning" />
          <ActionButton onClick={() => navigate(`/asteroid-match/${lesson.id}`, { state: { from: location.pathname } })} label="Game" icon={<Gamepad2 className="h-4 w-4" />} variant="default" />
          {isOwner && (
            <ActionButton onClick={() => navigate(`/edit/${lesson.id}`)} label="Chỉnh sửa" icon={<Pencil className="h-4 w-4" />} variant="gray" />
          )}
        </div>
      </div>

      {/* Vocabulary Table */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
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
