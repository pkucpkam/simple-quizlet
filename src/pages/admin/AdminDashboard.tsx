import React, { useState, useEffect, useCallback } from 'react';
import { getPaginatedUsers, type UserInfo } from '../../service/userService';
import { lessonService } from '../../service/lessonService';
import { folderService } from '../../service/folderService';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import type { Folder } from '../../types/folder';
import type { Lesson } from '../../types/lesson';
import Pagination from '../../components/common/Pagination';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import Badge from '../../components/ui/Badge';
import { SkeletonTable } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { Plus, X } from 'lucide-react';

type TabType = 'users' | 'lessons' | 'folders';

const tabLabels: Record<TabType, string> = {
  users: 'Người dùng',
  lessons: 'Bài học',
  folders: 'Thư mục',
};

interface MetricCardProps { label: string; value: string | number; sub?: string; accent?: string; }

const MetricCard: React.FC<MetricCardProps> = ({ label, value, sub, accent = 'text-claude-text' }) => (
  <div className="bg-claude-surface border border-claude-border rounded-claude-md p-5 shadow-claude-sm">
    <p className="text-xs font-semibold text-claude-text-2 uppercase tracking-wider mb-2">{label}</p>
    <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    {sub && <p className="text-xs text-claude-text-3 mt-1">{sub}</p>}
  </div>
);

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');

  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Map<number, QueryDocumentSnapshot<DocumentData> | null>>(new Map([[1, null]]));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const cursor = pageCursors.get(currentPage) || null;
      if (activeTab === 'users') {
        const result = await getPaginatedUsers(pageSize, cursor);
        setUsers(result.users);
        setTotalItems(result.total);
        if (result.hasMore && result.lastVisible) setPageCursors(prev => new Map(prev).set(currentPage + 1, result.lastVisible));
      } else if (activeTab === 'lessons') {
        const result = await lessonService.getAllLessonsPaginated(pageSize, cursor, totalItems > 0);
        setLessons(result.lessons);
        if (totalItems === 0) setTotalItems(result.total);
        if (result.hasMore && result.lastVisible) setPageCursors(prev => new Map(prev).set(currentPage + 1, result.lastVisible));
      } else if (activeTab === 'folders') {
        const result = await folderService.getAllFoldersPaginated(pageSize, cursor, totalItems > 0);
        setFolders(result.folders);
        if (totalItems === 0) setTotalItems(result.total);
        if (result.hasMore && result.lastVisible) setPageCursors(prev => new Map(prev).set(currentPage + 1, result.lastVisible));
      }
    } catch { toast.error('Không thể tải dữ liệu'); }
    finally { setLoading(false); }
  }, [activeTab, currentPage, pageSize, pageCursors, totalItems]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setPageCursors(new Map([[1, null]]));
    setTotalItems(0);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLesson = async (id: string) => {
    if (!window.confirm('Xóa bài học này?')) return;
    try {
      await lessonService.deleteLessonById(id);
      setLessons(lessons.filter(l => l.id !== id));
      toast.success('Đã xóa bài học');
    } catch { toast.error('Lỗi khi xóa bài học'); }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!window.confirm('Xóa thư mục này?')) return;
    try {
      await folderService.deleteFolder(id);
      setFolders(folders.filter(f => f.id !== id));
      toast.success('Đã xóa thư mục');
    } catch { toast.error('Lỗi khi xóa thư mục'); }
  };

  const handleCreateSystemFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    const storedUser = sessionStorage.getItem('user');
    const username = storedUser ? JSON.parse(storedUser).username : 'Admin';
    try {
      await folderService.createFolder(username, { name: newFolderName, icon: newFolderIcon, isOfficial: true });
      toast.success('Đã tạo thư mục hệ thống');
      setNewFolderName('');
      setShowFolderForm(false);
      setCurrentPage(1);
      setPageCursors(new Map([[1, null]]));
      fetchData();
    } catch { toast.error('Lỗi khi tạo thư mục'); }
  };

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-claude-text-2 uppercase tracking-wider";

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-claude-text">Admin Console</h1>
          <p className="text-sm text-claude-text-2 mt-0.5">Quản lý nội dung và người dùng</p>
        </div>
        <Link
          to="/admin/create-lesson"
          className="flex items-center gap-2 px-4 py-2 bg-claude-accent text-white text-sm font-medium rounded-claude hover:bg-claude-accent-2 transition-colors shadow-claude-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Bài học hệ thống
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Tổng người dùng" value={activeTab === 'users' ? totalItems : '—'} accent="text-claude-text" />
        <MetricCard label="Tổng bài học" value={activeTab === 'lessons' ? totalItems : '—'} accent="text-claude-accent" />
        <MetricCard label="Thư mục hệ thống" value={activeTab === 'folders' ? totalItems : '—'} accent="text-purple-600" />
      </div>

      {/* Main Content Card */}
      <div className="bg-claude-surface border border-claude-border rounded-claude-md shadow-claude-sm overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-claude-border px-4 flex gap-1 pt-2">
          {(Object.keys(tabLabels) as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-claude-accent text-claude-accent'
                  : 'border-transparent text-claude-text-2 hover:text-claude-text'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* ── Users Tab ── */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-claude-border">
                  <tr>
                    <th className={thClass}>Người dùng</th>
                    <th className={thClass}>Email</th>
                    <th className={thClass}>Vai trò</th>
                    <th className={`${thClass} text-right`}>Hành động</th>
                  </tr>
                </thead>
                {loading ? (
                  <SkeletonTable rows={pageSize} cols={4} />
                ) : users.length === 0 ? (
                  <tbody><tr><td colSpan={4}><EmptyState title="Không có người dùng" /></td></tr></tbody>
                ) : (
                  <tbody className="divide-y divide-claude-border">
                    {users.map((user) => (
                      <tr key={user.uid} className="claude-table-row group">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              className="h-8 w-8 rounded-full border border-claude-border object-cover"
                              src={user.photoURL || '/logo/brain.png'}
                              alt=""
                            />
                            <div>
                              <div className="text-sm font-medium text-claude-text">{user.username}</div>
                              <div className="text-xs text-claude-text-3">UID: {user.uid?.slice(0, 10)}…</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-claude-text-2">{user.email || 'N/A'}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant={user.role === 'ADMIN' ? 'admin' : 'neutral'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toast.error('Tính năng đang bảo trì')}
                            className="text-xs text-claude-error hover:underline"
                          >
                            Hạn chế
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          )}

          {/* ── Lessons Tab ── */}
          {activeTab === 'lessons' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-claude-border">
                  <tr>
                    <th className={thClass}>Tên bài học</th>
                    <th className={thClass}>Loại</th>
                    <th className={thClass}>Nguồn</th>
                    <th className={thClass}>Số từ</th>
                    <th className={`${thClass} text-right`}>Hành động</th>
                  </tr>
                </thead>
                {loading ? (
                  <SkeletonTable rows={pageSize} cols={5} />
                ) : lessons.length === 0 ? (
                  <tbody><tr><td colSpan={5}><EmptyState title="Không có bài học" /></td></tr></tbody>
                ) : (
                  <tbody className="divide-y divide-claude-border">
                    {lessons.map((lesson) => (
                      <tr key={lesson.id} className="claude-table-row group">
                        <td className="px-4 py-3.5 text-sm font-medium text-claude-text">{lesson.title}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant={lesson.isOfficial ? 'official' : 'neutral'}>
                            {lesson.isOfficial ? 'Hệ thống' : 'Người dùng'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-claude-text-2">{lesson.creator}</td>
                        <td className="px-4 py-3.5 text-sm font-medium text-claude-accent">{lesson.wordCount}</td>
                        <td className="px-4 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/edit/${lesson.id}`}
                            className="text-xs text-claude-info hover:underline mr-3"
                          >
                            Sửa
                          </Link>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-xs text-claude-error hover:underline"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          )}

          {/* ── Folders Tab ── */}
          {activeTab === 'folders' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-claude-text">Thư mục hệ thống</h3>
                <button
                  onClick={() => setShowFolderForm(!showFolderForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-claude bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  {showFolderForm ? 'Hủy bỏ' : '+ Tạo mới'}
                </button>
              </div>

              {showFolderForm && (
                <form
                  onSubmit={handleCreateSystemFolder}
                  className="mb-6 p-4 bg-claude-surface-2 border border-claude-border rounded-claude-md"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-claude-text-2 uppercase tracking-wider">Tên thư mục</label>
                      <input
                        type="text"
                        className="px-3 py-2 text-sm bg-claude-surface border border-claude-border rounded-claude text-claude-text placeholder:text-claude-text-3 focus:outline-none focus:ring-2 focus:ring-claude-accent"
                        placeholder="VD: TOEIC Preparation"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-claude-text-2 uppercase tracking-wider">Icon</label>
                      <select
                        className="px-3 py-2 text-sm bg-claude-surface border border-claude-border rounded-claude text-claude-text focus:outline-none focus:ring-2 focus:ring-claude-accent"
                        value={newFolderIcon}
                        onChange={(e) => setNewFolderIcon(e.target.value)}
                      >
                        <option value="📁">📁 Mặc định</option>
                        <option value="🎓">🎓 Học tập</option>
                        <option value="⭐">⭐ Quan trọng</option>
                        <option value="🚀">🚀 Nâng cao</option>
                        <option value="📚">📚 Tổng hợp</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 bg-claude-accent text-white text-sm font-medium rounded-claude hover:bg-claude-accent-2 transition-colors"
                      >
                        Lưu thư mục
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 skeleton rounded-claude-md" />
                  ))}
                </div>
              ) : folders.length === 0 ? (
                <EmptyState title="Chưa có thư mục nào" description="Tạo thư mục đầu tiên bằng nút bên trên." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="group bg-claude-surface border border-claude-border rounded-claude-md p-4 hover:border-purple-300 hover:shadow-claude transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-2xl bg-claude-surface-2 w-12 h-12 flex items-center justify-center rounded-claude-md group-hover:scale-105 transition-transform">
                          {folder.icon}
                        </div>
                        <button
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="text-claude-text-3 hover:text-claude-error opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-claude hover:bg-claude-error-light"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <h4 className="text-sm font-semibold text-claude-text truncate group-hover:text-purple-600 transition-colors">{folder.name}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-claude-text-3">{folder.creator}</span>
                        <span className="text-claude-border">·</span>
                        <span className="text-xs text-purple-500 font-medium">{folder.lessonCount} bài học</span>
                        {folder.isOfficial && <Badge variant="official" size="sm">Official</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && (
            <div className="mt-5 pt-4 border-t border-claude-border flex items-center justify-between">
              <p className="text-xs text-claude-text-3">
                Trang {currentPage} / {totalPages} · {totalItems} mục
              </p>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
