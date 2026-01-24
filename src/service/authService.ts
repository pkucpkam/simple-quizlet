import { signOut } from 'firebase/auth';
import { auth } from './firebase_setup';

interface LogoutResult {
  success: boolean;
  message?: string;
}

export const logoutUser = async (): Promise<LogoutResult> => {
  try {
    await signOut(auth);
    return { success: true, message: 'Đăng xuất thành công!' };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, message: 'Đã có lỗi xảy ra: ' + err.message };
    }
    return { success: false, message: 'Đã có lỗi xảy ra' };
  }
};