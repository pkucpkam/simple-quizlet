import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase_setup';
import type { User } from 'firebase/auth';

interface UserInfo {
  username: string;
}

export const getUserInfo = async (user: User): Promise<UserInfo> => {
  try {
    console.log('[getUserInfo] Đang lấy thông tin user với UID:', user.uid);

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    console.log('[getUserInfo] Document snapshot:', userDoc.exists() ? userDoc.data() : 'Không tồn tại');

    if (userDoc.exists()) {
      const data = userDoc.data();
      return { username: data.username || 'Không có username' };
    } else {
      return { username: user.email || 'Người dùng' };
    }
  } catch (err) {
    console.error('[getUserInfo] Lỗi khi lấy thông tin người dùng:', err);
    return { username: user.email || 'Người dùng' };
  }
};
