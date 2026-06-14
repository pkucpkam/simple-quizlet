import React, { useEffect, useState, useRef } from 'react';
import { auth } from '../service/firebase_setup';
import { getUserInfo, updateUserAvatar } from '../service/userService';
import type { User } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { Skeleton } from '../components/ui/Skeleton';
import { Camera, Loader2, User as UserIcon, Mail, Calendar } from 'lucide-react';

interface UserProfileData {
  username?: string;
  email?: string;
  photoURL?: string;
  createdAt?: string | number;
}

const CameraIcon = () => <Camera className="h-5 w-5 text-white drop-shadow-md" />;

const FieldRow = ({ label, icon, value }: { label: string; icon: React.ReactNode; value: string }) => (
  <div>
    <label className="block text-xs font-semibold text-claude-text-2 uppercase tracking-wider mb-1.5">{label}</label>
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-claude-surface-2 border border-claude-border rounded-claude">
      <span className="text-claude-text-3 flex-shrink-0">{icon}</span>
      <span className="text-sm text-claude-text">{value}</span>
    </div>
  </div>
);

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
        setUserInfo({ ...info, email: currentEmail });
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleAvatarClick = () => { if (!uploading && fileInputRef.current) fileInputRef.current.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Kích thước ảnh tối đa là 5MB'); return; }
    if (!auth.currentUser) { toast.error('Bạn chưa đăng nhập'); return; }

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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const initials = userInfo?.username?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-claude-text">Hồ sơ cá nhân</h1>
        <p className="text-sm text-claude-text-2 mt-0.5">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="bg-claude-surface border border-claude-border rounded-claude-lg shadow-claude-sm overflow-hidden">
        {/* Avatar section */}
        <div className="px-6 py-5 border-b border-claude-border flex items-center gap-4">
          <div
            onClick={handleAvatarClick}
            className="group relative h-16 w-16 cursor-pointer rounded-full overflow-hidden flex-shrink-0 border-2 border-claude-border shadow-claude-sm"
          >
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
                <Loader2 className="h-5 w-5 animate-spin text-claude-accent" />
              </div>
            )}
            {userInfo?.photoURL ? (
              <img src={userInfo.photoURL} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-claude-accent">
                <span className="text-2xl font-bold text-white">{initials}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <CameraIcon />
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileChange} />
          </div>

          <div>
            {loading ? (
              <>
                <Skeleton className="h-5 w-32 rounded mb-2" />
                <Skeleton className="h-4 w-20 rounded" />
              </>
            ) : (
              <>
                <p className="font-semibold text-claude-text">{userInfo?.username || 'Người dùng'}</p>
                <p className="text-sm text-claude-text-2">{userInfo?.email || ''}</p>
              </>
            )}
            <p className="text-xs text-claude-text-3 mt-1">Nhấp vào ảnh để thay đổi</p>
          </div>
        </div>

        {/* Profile fields */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i}>
                  <Skeleton className="h-3.5 w-24 rounded mb-2" />
                  <Skeleton className="h-10 w-full rounded-claude" />
                </div>
              ))}
            </div>
          ) : userInfo ? (
            <div className="space-y-4">
               <FieldRow
                 label="Tên người dùng"
                 icon={<UserIcon className="h-4 w-4" />}
                 value={userInfo.username || '—'}
               />
               <FieldRow
                 label="Email"
                 icon={<Mail className="h-4 w-4" />}
                 value={userInfo.email || 'Chưa cập nhật'}
               />
               <FieldRow
                 label="Ngày tham gia"
                 icon={<Calendar className="h-4 w-4" />}
                 value={userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}
               />

              <div className="pt-4 border-t border-claude-border flex justify-end">
                <button
                  onClick={() => alert('Chức năng chỉnh sửa đang được phát triển')}
                  className="px-4 py-2 text-sm font-medium bg-claude-accent text-white rounded-claude hover:bg-claude-accent-2 transition-colors"
                >
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-claude-error bg-claude-error-light rounded-claude border border-red-200">
              Không tìm thấy thông tin người dùng.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
