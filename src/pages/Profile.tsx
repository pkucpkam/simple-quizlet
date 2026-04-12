import React, { useEffect, useState, useRef } from 'react';
import { auth } from '../service/firebase_setup';
import { getUserInfo, updateUserAvatar } from '../service/userService';
import type { User } from 'firebase/auth';
import { toast } from 'react-hot-toast';

interface UserProfileData {
  username?: string;
  email?: string;
  photoURL?: string;
  createdAt?: string | number;
}

const Profile: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = sessionStorage.getItem('user');
      let currentUid = '';
      let currentEmail = '';

      if (storedUser) {
        const userData = JSON.parse(storedUser);
        currentUid = userData.uid;
        currentEmail = userData.email;
      } else if (auth.currentUser) {
        currentUid = auth.currentUser.uid;
        currentEmail = auth.currentUser.email || '';
      }

      if (currentUid) {
        const info = await getUserInfo({ uid: currentUid, email: currentEmail } as unknown as User);
        setUserInfo({
          ...info,
          email: currentEmail
        });
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleAvatarClick = () => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB');
      return;
    }

    if (!auth.currentUser) {
      toast.error('Bạn chưa đăng nhập');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Đang cập nhật ảnh đại diện...');

    try {
      const url = await updateUserAvatar(auth, auth.currentUser, file);
      if (url) {
        setUserInfo(prev => prev ? { ...prev, photoURL: url } : null);
        toast.success('Cập nhật ảnh đại diện thành công!', { id: toastId });
      } else {
        toast.error('Không thể cập nhật ảnh đại diện', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi không xác định', { id: toastId });
    } finally {
      setUploading(false);
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-screen-md px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <div
            onClick={handleAvatarClick}
            className="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 border-teal-100 bg-teal-50 shadow-sm transition-transform hover:scale-105"
          >
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-teal-600"></div>
              </div>
            ) : null}
            {userInfo?.photoURL ? (
              <img src={userInfo.photoURL} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-3xl font-bold text-teal-700">
                  {userInfo?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
            <p className="text-sm text-gray-500">Quản lý thông tin tài khoản của bạn</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Đang tải thông tin...</div>
        ) : userInfo ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Tên người dùng</label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-900">{userInfo.username}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Email</label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="text-gray-900">{userInfo.email || 'Chưa cập nhật'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Ngày tham gia</label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-900">
                    {userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 shadow-sm"
                onClick={() => alert('Chức năng chỉnh sửa đang được phát triển')}
              >
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-red-500 bg-red-50 rounded-lg">Không tìm thấy thông tin người dùng.</div>
        )}
      </div>
    </div>
  );
};

export default Profile;
