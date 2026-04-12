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

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'lessons' | 'folders'>('users');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Folder Create State
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');

  // Pagination states
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Map<number, QueryDocumentSnapshot<DocumentData> | null>>(
    new Map([[1, null]])
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const cursor = pageCursors.get(currentPage) || null;
      
      if (activeTab === 'users') {
        const result = await getPaginatedUsers(pageSize, cursor);
        setUsers(result.users);
        setTotalItems(result.total);
        if (result.hasMore && result.lastVisible) {
          setPageCursors(prev => new Map(prev).set(currentPage + 1, result.lastVisible));
        }
      } else if (activeTab === 'lessons') {
        const result = await lessonService.getAllLessonsPaginated(pageSize, cursor);
        setLessons(result.lessons);
        setTotalItems(result.total);
        if (result.hasMore && result.lastVisible) {
            setPageCursors(prev => new Map(prev).set(currentPage + 1, result.lastVisible));
        }
      } else if (activeTab === 'folders') {
        const result = await folderService.getAllFoldersPaginated(pageSize, cursor);
        setFolders(result.folders);
        setTotalItems(result.total);
        if (result.hasMore && result.lastVisible) {
            setPageCursors(prev => new Map(prev).set(currentPage + 1, result.lastVisible));
        }
      }
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, pageSize, pageCursors]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage]);

  const handleTabChange = (tab: 'users' | 'lessons' | 'folders') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setPageCursors(new Map([[1, null]]));
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUser = () => {
    toast.error('Tính năng xóa người dùng đang được bảo trì');
  };

  const handleDeleteLesson = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài học này?')) {
      try {
        await lessonService.deleteLessonById(id);
        setLessons(lessons.filter(l => l.id !== id));
        toast.success('Đã xóa bài học');
      } catch {
        toast.error('Lỗi khi xóa bài học');
      }
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thư mục này?')) {
      try {
        await folderService.deleteFolder(id);
        setFolders(folders.filter(f => f.id !== id));
        toast.success('Đã xóa thư mục');
      } catch {
        toast.error('Lỗi khi xóa thư mục');
      }
    }
  };

  const handleCreateSystemFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;

    const storedUser = sessionStorage.getItem('user');
    const username = storedUser ? JSON.parse(storedUser).username : 'Admin';

    try {
      await folderService.createFolder(username, {
        name: newFolderName,
        icon: newFolderIcon,
        isOfficial: true
      });
      toast.success('Đã tạo thư mục hệ thống');
      setNewFolderName('');
      setShowFolderForm(false);
      // Reset to first page
      setCurrentPage(1);
      setPageCursors(new Map([[1, null]]));
      fetchData();
    } catch {
      toast.error('Lỗi khi tạo thư mục');
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Section */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Console</h1>
            </div>
            <div className="flex gap-3">
              <Link to="/admin/create-lesson" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl shadow-md text-white bg-blue-600 hover:bg-blue-700 transition transform hover:scale-105">
                + Bài học Hệ thống
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 transition hover:shadow-md">
            <div className="p-6 text-center">
              <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng người dùng</dt>
              <dd className="text-4xl font-black text-gray-900">{activeTab === 'users' ? totalItems : '...'}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 transition hover:shadow-md">
            <div className="p-6 text-center">
              <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng bài học</dt>
              <dd className="text-4xl font-black text-blue-600">{activeTab === 'lessons' ? totalItems : '...'}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 transition hover:shadow-md">
            <div className="p-6 text-center border-b md:border-b-0 md:border-r">
              <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Thư mục hệ thống</dt>
              <dd className="text-4xl font-black text-purple-600">{activeTab === 'folders' ? totalItems : '...'}</dd>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex space-x-8 border-b border-gray-200">
          {(['users', 'lessons', 'folders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab === 'users' ? 'Quản lý người dùng' : tab === 'lessons' ? 'Quản lý bài học' : 'Thư mục hệ thống'}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-6"></div>
              <p className="text-gray-400 font-bold uppercase tracking-wider text-sm">Cập nhật dữ liệu từ máy chủ...</p>
            </div>
          ) : (
            <div className="p-8">
              {activeTab === 'users' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Người dùng</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Vai trò</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map((user) => (
                        <tr key={user.uid} className="group hover:bg-gray-50 transition">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                <img className="h-12 w-12 rounded-2xl border-2 border-white shadow-sm object-cover" src={user.photoURL || '/logo/brain.png'} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-black text-gray-900">{user.username}</div>
                                <div className="text-xs font-bold text-gray-300">UID: {user.uid?.slice(0, 12)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-500">{user.email || 'N/A'}</td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs font-black rounded-lg ${user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 uppercase tracking-tighter' : 'bg-gray-50 text-gray-400'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-bold opacity-0 group-hover:opacity-100 transition">
                            <button onClick={handleDeleteUser} className="text-red-500 hover:text-red-700 transition">Hạn chế quyền</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'lessons' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Tên bài học</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Loại</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Nguồn</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Số từ</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {lessons.map((lesson) => (
                        <tr key={lesson.id} className="group hover:bg-gray-50 transition">
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-gray-900">{lesson.title}</td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm">
                            {lesson.isOfficial ? (
                              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase">Hệ thống</span>
                            ) : (
                              <span className="bg-gray-100 text-gray-400 text-[10px] font-black px-2 py-1 rounded-md uppercase">Người dùng</span>
                            )}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-400">{lesson.creator}</td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-blue-600 font-mono">{lesson.wordCount}</td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-bold opacity-0 group-hover:opacity-100 transition">
                            <Link to={`/edit/${lesson.id}`} className="text-indigo-600 hover:text-indigo-900 border-r pr-3 mr-3">Sửa</Link>
                            <button onClick={() => handleDeleteLesson(lesson.id)} className="text-red-500 hover:text-red-700">Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'folders' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-gray-900">Tính năng Thư mục</h3>
                    <button
                      onClick={() => setShowFolderForm(!showFolderForm)}
                      className="bg-purple-50 text-purple-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition hover:bg-purple-100"
                    >
                      {showFolderForm ? 'Hủy bỏ' : '+ Tạo mới thư mục hệ thống'}
                    </button>
                  </div>

                  {showFolderForm && (
                    <form onSubmit={handleCreateSystemFolder} className="mb-10 bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tên thư mục</label>
                          <input
                            type="text"
                            className="w-full border-gray-200 rounded-xl p-3 focus:ring-purple-500 font-bold"
                            placeholder="VD: TOEIC Preparation"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Icon đại diện</label>
                          <select
                            className="w-full border-gray-200 rounded-xl p-3 focus:ring-purple-500 font-bold"
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
                          <button type="submit" className="w-full bg-purple-600 text-white p-3 rounded-xl font-black shadow-lg shadow-purple-100 transition hover:bg-purple-700">
                            LƯU THƯ MỤC
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {folders.map((folder) => (
                      <div key={folder.id} className="p-6 bg-white border border-gray-100 rounded-2xl group transition hover:border-purple-200 hover:shadow-xl hover:shadow-purple-50">
                        <div className="flex justify-between items-start mb-4">
                          <div className="text-3xl bg-gray-50 w-14 h-14 flex items-center justify-center rounded-2xl transition group-hover:scale-110">
                            {folder.icon}
                          </div>
                          <button onClick={() => handleDeleteFolder(folder.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <h4 className="text-lg font-black text-gray-900 group-hover:text-purple-600 transition truncate">{folder.name}</h4>
                        <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {folder.creator}
                          </span>
                          <span className="text-gray-200">|</span>
                          <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg">{folder.lessonCount} bài học</span>
                          {folder.isOfficial && (
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[8px] uppercase font-black">Official</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination Controls */}
              <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">
                  Trang {currentPage} / {totalPages} (Tổng {totalItems})
                </p>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    activeColor="bg-blue-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
