import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase_setup';
import type { User } from 'firebase/auth';

interface UserInfo {
  username: string;
}

export const getUserInfo = async (user: User): Promise<UserInfo> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));

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
