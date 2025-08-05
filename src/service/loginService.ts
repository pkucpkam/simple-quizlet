import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase_setup';

interface LoginData {
  email: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  message?: string;
}

export const loginUser = async ({ email, password }: LoginData): Promise<LoginResult> => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true, message: 'Đăng nhập thành công!' };
  } catch (err: any) {
    switch (err.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return { success: false, message: 'Email hoặc mật khẩu không đúng!' };
      case 'auth/invalid-email':
        return { success: false, message: 'Email không hợp lệ!' };
      case 'auth/too-many-requests':
        return { success: false, message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau!' };
      default:
        return { success: false, message: 'Đã có lỗi xảy ra: ' + err.message };
    }
  }
};